import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🔐 Resetting admin password...');
  
  // Check if admin user exists
  const existingAdmin = await prisma.user.findFirst({
    where: { 
      OR: [
        { email: 'admin@bizzart.com' },
        { role: 'ADMIN' }
      ]
    }
  });
  
  if (!existingAdmin) {
    console.log('❌ No admin user found. Creating new admin user...');
    
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
    
    console.log('✅ Created new admin user:', adminUser.email);
    console.log('📝 Login credentials:');
    console.log('   Email: admin@bizzart.com');
    console.log('   Password: admin123');
  } else {
    // Reset password for existing admin
    const newPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    const updatedAdmin = await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Password reset successfully for admin user:', updatedAdmin.email);
    console.log('📝 New login credentials:');
    console.log('   Email:', updatedAdmin.email);
    console.log('   Password: admin123');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error resetting admin password:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
