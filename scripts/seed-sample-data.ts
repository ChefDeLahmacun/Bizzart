import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const sampleCategories = [
  'Bowls',
  'Vases',
  'Plates',
  'Mugs',
  'Sculptures',
  'Jewelry'
];

const sampleProducts = [
  {
    name: 'Handcrafted Ceramic Bowl',
    description: 'Beautiful handcrafted ceramic bowl perfect for serving or decoration. Made with premium clay and glazed for durability.',
    price: 45.99,
    stock: 10,
    category: 'Bowls',
    height: 8,
    width: 15,
    depth: 15,
    weight: 350
  },
  {
    name: 'Artistic Vase',
    description: 'Elegant artistic vase with unique patterns. Perfect as a centerpiece or for displaying flowers.',
    price: 89.99,
    stock: 5,
    category: 'Vases',
    height: 25,
    width: 12,
    depth: 12,
    weight: 800
  },
  {
    name: 'Decorative Plate Set',
    description: 'Set of 4 decorative plates with hand-painted designs. Each plate is unique and adds character to your dining table.',
    price: 65.99,
    stock: 8,
    category: 'Plates',
    height: 2,
    width: 25,
    depth: 25,
    weight: 500
  },
  {
    name: 'Handmade Coffee Mug',
    description: 'Comfortable handmade coffee mug with a rustic finish. Perfect for your morning coffee or tea.',
    price: 24.99,
    stock: 15,
    category: 'Mugs',
    height: 12,
    width: 8,
    depth: 8,
    weight: 300
  },
  {
    name: 'Ceramic Sculpture',
    description: 'Unique ceramic sculpture that adds artistic flair to any space. Each piece is one-of-a-kind.',
    price: 150.99,
    stock: 3,
    category: 'Sculptures',
    height: 30,
    width: 20,
    depth: 15,
    weight: 1200
  }
];

async function main() {
  console.log('🌱 Seeding sample data...');
  
  // Get admin user first
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!adminUser) {
    console.log('❌ No admin user found. Please run the reset-admin-password script first.');
    return;
  }
  
  console.log(`✅ Found admin user: ${adminUser.email}`);
  
  // Create categories
  console.log('📂 Creating categories...');
  const createdCategories: { [key: string]: any } = {};
  
  for (const categoryName of sampleCategories) {
    const existingCategory = await prisma.category.findUnique({
      where: { name: categoryName }
    });
    
    if (!existingCategory) {
      const category = await prisma.category.create({
        data: { name: categoryName }
      });
      createdCategories[categoryName] = category;
      console.log(`✅ Created category: ${categoryName}`);
    } else {
      createdCategories[categoryName] = existingCategory;
      console.log(`ℹ️ Category already exists: ${categoryName}`);
    }
  }
  
  // Create sample products
  console.log('🛍️ Creating sample products...');
  
  for (const productData of sampleProducts) {
    const category = createdCategories[productData.category];
    if (!category) {
      console.log(`⚠️ Category not found for product: ${productData.name}`);
      continue;
    }
    
    const existingProduct = await prisma.product.findFirst({
      where: { name: productData.name }
    });
    
    if (!existingProduct) {
      const product = await prisma.product.create({
        data: {
          name: productData.name,
          description: productData.description,
          price: productData.price,
          stock: productData.stock,
          categoryId: category.id,
          userId: adminUser.id,
          height: productData.height,
          width: productData.width,
          depth: productData.depth,
          weight: productData.weight
        }
      });
      console.log(`✅ Created product: ${product.name}`);
    } else {
      console.log(`ℹ️ Product already exists: ${productData.name}`);
    }
  }
  
  console.log('🎉 Sample data seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding sample data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
