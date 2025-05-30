-- 🧙‍♂️ LisaDocs - Simplified & Scalable PostgreSQL Schema
-- Focused on core document management: Upload → Store → View/Download → Archive
-- Designed for easy scalability and future feature additions

-- Extensions needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For future search features

-- ===== CORE TYPES =====
-- Simplified roles for the document management system
CREATE TYPE user_role AS ENUM (
  'administrador',      -- Can see everything, manage system
  'presidente',         -- High-level access across workspaces  
  'vicepresidente',     -- High-level access across workspaces
  'secretario_cam',     -- CAM workspace secretary
  'secretario_ampp',    -- AMPP workspace secretary  
  'secretario_cf',      -- CF workspace secretary
  'intendente',         -- Intendencia workspace access
  'cf_member'           -- Commission member
);

CREATE TYPE workspace_type AS ENUM (
  'cam',                -- Consejo de Administración Municipal
  'ampp',              -- Asamblea Municipal del Poder Popular
  'presidencia',       -- Presidencia
  'intendencia',       -- Intendencia
  'comisiones_cf'      -- Comisiones de Trabajo
);

-- Simplified document status - just the essentials
CREATE TYPE document_status AS ENUM (
  'draft',             -- 📝 User's private draft
  'stored',            -- 📁 Stored and visible to authorized roles
  'archived'           -- 📦 Archived but accessible
);

-- Notification types for system events
CREATE TYPE notification_type AS ENUM (
  'document_uploaded', 'document_archived', 'system_message', 'warning'
);

-- ===== MAIN TABLES =====

-- Users table - simplified but extensible
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) UNIQUE NOT NULL,
  "full_name" varchar(255) NOT NULL,
  "role" user_role NOT NULL,
  "workspace" workspace_type NOT NULL,
  "password_hash" varchar(255),
  "is_active" boolean DEFAULT true,
  "last_login_at" timestamptz,
  "preferences" jsonb DEFAULT '{}', -- For future UI preferences, settings, etc.
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  
  -- Constraints for data integrity
  CONSTRAINT "users_email_format" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT "users_full_name_length" CHECK (length(trim(full_name)) >= 2)
);

-- Documents table - core of the system
CREATE TABLE "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(500) NOT NULL,
  "description" text, -- Optional description of the document
  "file_url" varchar(1000) NOT NULL, -- Storage URL (Supabase/S3/etc)
  "file_name" varchar(255) NOT NULL,
  "file_size" bigint NOT NULL CHECK (file_size > 0),
  "mime_type" varchar(100) NOT NULL,
  "file_hash" varchar(64), -- SHA-256 for file integrity verification
  "status" document_status DEFAULT 'draft',
  "workspace" workspace_type NOT NULL,
  "tags" text[] DEFAULT '{}', -- For categorization and future search
  "metadata" jsonb DEFAULT '{}', -- Extensible metadata for future features
  "created_by" uuid NOT NULL,
  "stored_at" timestamptz, -- When moved from draft to stored
  "archived_at" timestamptz, -- When archived
  "expires_at" timestamptz, -- Optional expiration date
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now(),
  
  -- Business logic constraints
  CONSTRAINT "documents_title_length" CHECK (length(trim(title)) >= 3),
  CONSTRAINT "documents_status_timestamps" CHECK (
    (status = 'draft' AND stored_at IS NULL AND archived_at IS NULL) OR
    (status = 'stored' AND stored_at IS NOT NULL AND archived_at IS NULL) OR  
    (status = 'archived' AND stored_at IS NOT NULL AND archived_at IS NOT NULL)
  ),
  CONSTRAINT "documents_expires_future" CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Role-based permissions matrix - defines who can see what
CREATE TABLE "role_permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "from_role" user_role NOT NULL, -- The role that has the permission
  "to_workspace" workspace_type NOT NULL, -- The workspace they can access
  "can_view" boolean DEFAULT false,
  "can_download" boolean DEFAULT false,
  "can_archive_others" boolean DEFAULT false, -- Can archive documents from other users
  "can_manage_workspace" boolean DEFAULT false, -- Future: manage workspace settings
  "created_at" timestamptz DEFAULT now(),
  
  -- Unique constraint to prevent duplicates
  CONSTRAINT "role_permissions_unique" UNIQUE (from_role, to_workspace)
);

-- Activity tracking for compliance and analytics
CREATE TABLE "document_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "action" varchar(50) NOT NULL, -- 'uploaded', 'viewed', 'downloaded', 'archived', 'restored'
  "details" jsonb DEFAULT '{}', -- Additional context (file size downloaded, etc.)
  "ip_address" inet,
  "user_agent" text,
  "created_at" timestamptz DEFAULT now(),
  
  -- Ensure valid actions
  CONSTRAINT "valid_actions" CHECK (action IN ('uploaded', 'viewed', 'downloaded', 'archived', 'restored', 'deleted'))
);

-- Simple notifications system  
CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "message" text NOT NULL,
  "type" notification_type NOT NULL,
  "related_document_id" uuid, -- Optional link to a document
  "is_read" boolean DEFAULT false,
  "read_at" timestamptz,
  "expires_at" timestamptz, -- Auto-cleanup old notifications
  "created_at" timestamptz DEFAULT now(),
  
  -- Consistency checks
  CONSTRAINT "notifications_read_logic" CHECK (
    (is_read = true AND read_at IS NOT NULL) OR
    (is_read = false AND read_at IS NULL)
  )
);

-- System settings for configuration and feature flags
CREATE TABLE "system_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" varchar(100) UNIQUE NOT NULL,
  "value" jsonb NOT NULL,
  "description" text,
  "is_public" boolean DEFAULT false, -- If setting can be read by regular users
  "created_at" timestamptz DEFAULT now(),
  "updated_at" timestamptz DEFAULT now()
);

-- ===== DOCUMENTATION =====
COMMENT ON TABLE "users" IS '🧑‍💼 System users with role-based access to workspaces';
COMMENT ON TABLE "documents" IS '📄 Core documents with simple draft→stored→archived lifecycle';
COMMENT ON TABLE "role_permissions" IS '🔐 Role-based permission matrix for workspace access';
COMMENT ON TABLE "document_activities" IS '📊 Activity tracking for all document interactions';
COMMENT ON TABLE "notifications" IS '🔔 Simple notification system for user alerts';
COMMENT ON TABLE "system_settings" IS '⚙️ System configuration and feature flags';

-- ===== FOREIGN KEYS =====
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" 
  FOREIGN KEY ("created_by") REFERENCES "users" ("id") ON DELETE RESTRICT;

ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_document_id_fkey" 
  FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE CASCADE;

ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" 
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_document_id_fkey" 
  FOREIGN KEY ("related_document_id") REFERENCES "documents" ("id") ON DELETE SET NULL;

-- ===== PERFORMANCE INDEXES =====
-- Users indexes
CREATE INDEX "idx_users_email" ON "users" ("email");
CREATE INDEX "idx_users_workspace_role_active" ON "users" ("workspace", "role", "is_active");
CREATE INDEX "idx_users_role" ON "users" ("role") WHERE is_active = true;

-- Documents indexes - optimized for main queries
CREATE INDEX "idx_documents_workspace_status" ON "documents" ("workspace", "status");
CREATE INDEX "idx_documents_created_by_status" ON "documents" ("created_by", "status");
CREATE INDEX "idx_documents_status_created" ON "documents" ("status", "created_at" DESC);
CREATE INDEX "idx_documents_tags" ON "documents" USING GIN ("tags");
CREATE INDEX "idx_documents_title_search" ON "documents" USING GIN (to_tsvector('spanish', title));
CREATE INDEX "idx_documents_metadata" ON "documents" USING GIN ("metadata");

-- Activity tracking indexes
CREATE INDEX "idx_document_activities_document" ON "document_activities" ("document_id", "created_at" DESC);
CREATE INDEX "idx_document_activities_user" ON "document_activities" ("user_id", "created_at" DESC);
CREATE INDEX "idx_document_activities_action" ON "document_activities" ("action", "created_at" DESC);

-- Permissions and notifications
CREATE INDEX "idx_role_permissions_from_role" ON "role_permissions" ("from_role");
CREATE INDEX "idx_notifications_user_unread" ON "notifications" ("user_id", "is_read", "created_at" DESC);

-- ===== AUTOMATED FUNCTIONS =====

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-track document status changes
CREATE OR REPLACE FUNCTION track_document_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Track when document moves to 'stored'
    IF OLD.status = 'draft' AND NEW.status = 'stored' THEN
        NEW.stored_at = now();
        
        INSERT INTO document_activities (document_id, user_id, action, details)
        VALUES (NEW.id, NEW.created_by, 'uploaded', jsonb_build_object(
            'from_status', OLD.status,
            'to_status', NEW.status,
            'file_size', NEW.file_size
        ));
    END IF;
    
    -- Track when document is archived
    IF OLD.status != 'archived' AND NEW.status = 'archived' THEN
        NEW.archived_at = now();
        
        INSERT INTO document_activities (document_id, user_id, action, details)
        VALUES (NEW.id, NEW.created_by, 'archived', jsonb_build_object(
            'from_status', OLD.status,
            'to_status', NEW.status
        ));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER track_document_status_changes BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION track_document_status_change();

-- ===== UTILITY FUNCTIONS =====

-- Check if user can access documents from a workspace
CREATE OR REPLACE FUNCTION user_can_access_workspace(user_uuid uuid, target_workspace workspace_type)
RETURNS boolean AS $$
DECLARE
    user_role_val user_role;
    can_view_val boolean;
BEGIN
    -- Get user's role
    SELECT role INTO user_role_val FROM users WHERE id = user_uuid;
    
    -- Check role permissions
    SELECT can_view INTO can_view_val 
    FROM role_permissions 
    WHERE from_role = user_role_val AND to_workspace = target_workspace;
    
    RETURN COALESCE(can_view_val, false);
END;
$$ LANGUAGE 'plpgsql';

-- Get documents accessible to a user
CREATE OR REPLACE FUNCTION get_accessible_documents(user_uuid uuid)
RETURNS TABLE (
    id uuid,
    title varchar,
    file_name varchar,
    file_size bigint,
    status document_status,
    workspace workspace_type,
    created_by uuid,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.title, d.file_name, d.file_size, d.status, d.workspace, d.created_by, d.created_at
    FROM documents d
    JOIN users u ON u.id = user_uuid
    WHERE (
        -- Own documents (all statuses)
        d.created_by = user_uuid 
        OR
        -- Others' documents (only stored ones if has permission)
        (d.status = 'stored' AND user_can_access_workspace(user_uuid, d.workspace))
    )
    ORDER BY d.created_at DESC;
END;
$$ LANGUAGE 'plpgsql';

-- Cleanup function for maintenance
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Clean up old read notifications (older than 3 months)
    DELETE FROM notifications 
    WHERE is_read = true 
    AND read_at < now() - interval '3 months';
    
    -- Clean up expired notifications
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at < now();
    
    -- Clean up old activities (keep 2 years for compliance)
    DELETE FROM document_activities 
    WHERE created_at < now() - interval '2 years'
    AND action NOT IN ('uploaded', 'archived'); -- Keep important events longer
    
    RAISE NOTICE 'Cleanup completed successfully';
END;
$$ LANGUAGE 'plpgsql';

-- ===== DEFAULT ROLE PERMISSIONS =====
-- Insert default permission matrix (adjust as needed)
INSERT INTO role_permissions (from_role, to_workspace, can_view, can_download, can_archive_others, can_manage_workspace) VALUES
-- Administrador - can access everything
('administrador', 'cam', true, true, true, true),
('administrador', 'ampp', true, true, true, true),
('administrador', 'presidencia', true, true, true, true),
('administrador', 'intendencia', true, true, true, true),
('administrador', 'comisiones_cf', true, true, true, true),

-- Presidente - high level access
('presidente', 'cam', true, true, true, false),
('presidente', 'ampp', true, true, true, false),
('presidente', 'presidencia', true, true, true, true),
('presidente', 'intendencia', true, true, false, false),
('presidente', 'comisiones_cf', true, true, false, false),

-- Vicepresidente - similar to presidente but limited management
('vicepresidente', 'cam', true, true, false, false),
('vicepresidente', 'ampp', true, true, false, false),
('vicepresidente', 'presidencia', true, true, true, false),
('vicepresidente', 'intendencia', true, true, false, false),
('vicepresidente', 'comisiones_cf', true, true, false, false),

-- Secretarios - full access to their workspace, limited to others
('secretario_cam', 'cam', true, true, true, true),
('secretario_cam', 'presidencia', true, true, false, false),

('secretario_ampp', 'ampp', true, true, true, true),
('secretario_ampp', 'presidencia', true, true, false, false),

('secretario_cf', 'comisiones_cf', true, true, true, true),
('secretario_cf', 'presidencia', true, true, false, false),

-- Intendente - access to intendencia and limited presidential access
('intendente', 'intendencia', true, true, true, true),
('intendente', 'presidencia', true, true, false, false),

-- CF Members - only their workspace
('cf_member', 'comisiones_cf', true, true, false, false);

-- ===== INITIAL SYSTEM SETTINGS =====
INSERT INTO system_settings (key, value, description, is_public) VALUES
('max_file_size_mb', '50', 'Maximum file size allowed for uploads in MB', true),
('allowed_file_types', '["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "png"]', 'Allowed file extensions', true),
('auto_archive_days', '365', 'Days after which stored documents are auto-archived', false),
('notification_retention_days', '90', 'Days to keep read notifications', false),
('enable_file_versioning', 'false', 'Enable document versioning feature', false),
('enable_advanced_search', 'false', 'Enable full-text search capabilities', false);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 LisaDocs database schema created successfully!';
    RAISE NOTICE '📊 Tables: % created', (SELECT count(*) FROM information_schema.tables WHERE table_schema = current_schema());
    RAISE NOTICE '🔗 Foreign keys: % created', (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY');
    RAISE NOTICE '📈 Indexes: % created', (SELECT count(*) FROM pg_indexes WHERE schemaname = current_schema());
    RAISE NOTICE '⚙️ Functions: % created', (SELECT count(*) FROM information_schema.routines WHERE routine_schema = current_schema());
END $$; 