import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('👤 Creating admin user...');
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@bizzart.com' }
  });
  
  if (existingAdmin) {
    console.log('✅ Admin user already exists:', existingAdmin.email);
    return;
  }
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@bizzart.com',
      password: hashedPassword,
      role: 'ADMIN',
      language: 'en'
    }
  });
  
  console.log('✅ Created admin user:', adminUser.email);
  console.log('📝 Login credentials:');
  console.log('   Email: admin@bizzart.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 