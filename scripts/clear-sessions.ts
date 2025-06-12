import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🧹 Clearing all sessions...');
  
  try {
    // Clear all sessions
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ Deleted ${deletedSessions.count} sessions`);
    
    // Clear all accounts (OAuth connections)
    const deletedAccounts = await prisma.account.deleteMany({});
    console.log(`✅ Deleted ${deletedAccounts.count} OAuth accounts`);
    
    console.log('✨ All sessions cleared successfully!');
    console.log('📝 Please log in again with your credentials.');
  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 