-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('administrador', 'presidente', 'vicepresidente', 'secretario_cam', 'secretario_ampp', 'secretario_cf', 'intendente', 'cf_member');

-- CreateEnum
CREATE TYPE "workspace_type" AS ENUM ('cam', 'ampp', 'presidencia', 'intendencia', 'comisiones_cf');

-- CreateEnum
CREATE TYPE "document_status" AS ENUM ('draft', 'stored', 'archived');

-- CreateEnum
CREATE TYPE "notification_type" AS ENUM ('document_uploaded', 'document_archived', 'system_message', 'warning');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" "user_role" NOT NULL,
    "workspace" "workspace_type" NOT NULL,
    "password_hash" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(6),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_format" CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT "users_full_name_length" CHECK (length(trim(full_name)) >= 2)
);

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "file_url" VARCHAR(1000) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_size" BIGINT NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "file_hash" VARCHAR(64),
    "status" "document_status" NOT NULL DEFAULT 'draft',
    "workspace" "workspace_type" NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" UUID NOT NULL,
    "stored_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "documents_title_length" CHECK (length(trim(title)) >= 3),
    CONSTRAINT "documents_status_timestamps" CHECK (
        (status = 'draft' AND stored_at IS NULL AND archived_at IS NULL) OR
        (status = 'stored' AND stored_at IS NOT NULL AND archived_at IS NULL) OR  
        (status = 'archived' AND stored_at IS NOT NULL AND archived_at IS NOT NULL)
    ),
    CONSTRAINT "documents_expires_future" CHECK (expires_at IS NULL OR expires_at > created_at),
    CONSTRAINT "documents_file_size_check" CHECK (file_size > 0)
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_role" "user_role" NOT NULL,
    "to_workspace" "workspace_type" NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT false,
    "can_download" BOOLEAN NOT NULL DEFAULT false,
    "can_archive_others" BOOLEAN NOT NULL DEFAULT false,
    "can_manage_workspace" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "document_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "valid_actions" CHECK (action IN ('uploaded', 'viewed', 'downloaded', 'archived', 'restored', 'deleted'))
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" "notification_type" NOT NULL,
    "related_document_id" UUID,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_read_logic" CHECK (
        (is_read = true AND read_at IS NOT NULL) OR
        (is_read = false AND read_at IS NULL)
    )
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_from_role_to_workspace_key" ON "role_permissions"("from_role", "to_workspace");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- Performance Indexes
CREATE INDEX "idx_users_email" ON "users"("email");
CREATE INDEX "idx_users_workspace_role_active" ON "users"("workspace", "role", "is_active");
CREATE INDEX "idx_users_role" ON "users"("role") WHERE is_active = true;

CREATE INDEX "idx_documents_workspace_status" ON "documents"("workspace", "status");
CREATE INDEX "idx_documents_created_by_status" ON "documents"("created_by", "status");
CREATE INDEX "idx_documents_status_created" ON "documents"("status", "created_at" DESC);
CREATE INDEX "idx_documents_tags" ON "documents" USING GIN("tags");
CREATE INDEX "idx_documents_title_search" ON "documents" USING GIN(to_tsvector('spanish', title));
CREATE INDEX "idx_documents_metadata" ON "documents" USING GIN("metadata");

CREATE INDEX "idx_document_activities_document" ON "document_activities"("document_id", "created_at" DESC);
CREATE INDEX "idx_document_activities_user" ON "document_activities"("user_id", "created_at" DESC);
CREATE INDEX "idx_document_activities_action" ON "document_activities"("action", "created_at" DESC);

CREATE INDEX "idx_role_permissions_from_role" ON "role_permissions"("from_role");
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "is_read", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_activities" ADD CONSTRAINT "document_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_related_document_id_fkey" FOREIGN KEY ("related_document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create automated functions
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

-- Utility functions
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

-- Insert default permission matrix
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

-- Insert initial system settings
INSERT INTO system_settings (key, value, description, is_public) VALUES
('max_file_size_mb', '50', 'Maximum file size allowed for uploads in MB', true),
('allowed_file_types', '["pdf", "doc", "docx", "xls", "xlsx", "txt", "jpg", "png"]', 'Allowed file extensions', true),
('auto_archive_days', '365', 'Days after which stored documents are auto-archived', false),
('notification_retention_days', '90', 'Days to keep read notifications', false),
('enable_file_versioning', 'false', 'Enable document versioning feature', false),
('enable_advanced_search', 'false', 'Enable full-text search capabilities', false); 