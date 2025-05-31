import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Comenzando el seeding de la base de datos...');

  // Verificar si ya existe un administrador
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'administrador' }
  });

  if (existingAdmin) {
    console.log('✅ Ya existe un usuario administrador:', existingAdmin.email);
    return;
  }

  // Crear el usuario administrador
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lisadocs.gob.cu',
      fullName: 'Administrador del Sistema',
      role: 'administrador',
      workspace: 'presidencia', // El admin pertenece a presidencia pero puede ver todo
      passwordHash: hashedPassword,
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'es',
        notifications: {
          email: true,
          browser: true
        },
        dashboard: {
          defaultView: 'all_workspaces',
          itemsPerPage: 20
        }
      }
    }
  });

  console.log('🎉 Usuario administrador creado exitosamente:');
  console.log(`📧 Email: ${adminUser.email}`);
  console.log(`👤 Nombre: ${adminUser.fullName}`);
  console.log(`🔑 Role: ${adminUser.role}`);
  console.log(`🏢 Workspace: ${adminUser.workspace}`);
  console.log(`🆔 ID: ${adminUser.id}`);

  // Verificar permisos del administrador
  const adminPermissions = await prisma.rolePermission.findMany({
    where: { fromRole: 'administrador' }
  });

  console.log(`\n🔐 Permisos del administrador (${adminPermissions.length} workspaces):`);
  adminPermissions.forEach(permission => {
    console.log(`  📁 ${permission.toWorkspace}: ✅ Ver | ✅ Descargar | ✅ Archivar | ✅ Gestionar`);
  });

  // Crear una notificación de bienvenida
  await prisma.notification.create({
    data: {
      userId: adminUser.id,
      title: '¡Bienvenido a LisaDocs!',
      message: 'Tu cuenta de administrador ha sido creada exitosamente. Ya puedes comenzar a gestionar el sistema de documentos.',
      type: 'system_message',
      isRead: false
    }
  });

  console.log('\n🔔 Notificación de bienvenida creada');
  console.log('\n✨ ¡El seeding se completó exitosamente!');
  console.log('\n🚀 Credenciales para login:');
  console.log('   📧 Email: admin@lisadocs.gob.cu');
  console.log('   🔒 Password: Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
