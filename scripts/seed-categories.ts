import { prisma } from '../src/lib/prisma';

const defaultCategories = [
  { name: 'Bowls' },
  { name: 'Vases' },
  { name: 'Plates' },
  { name: 'Mugs' },
  { name: 'Sculptures' },
  { name: 'Jewelry' },
];

async function main() {
  console.log('🌱 Seeding categories...');
  
  for (const category of defaultCategories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`✅ Created category: ${created.name}`);
  }
  
  console.log('✨ Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 