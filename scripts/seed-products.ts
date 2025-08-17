import { prisma } from '../src/lib/prisma';

const sampleProducts = [
  {
    name: 'Handcrafted Ceramic Bowl',
    description: 'Beautiful handcrafted ceramic bowl perfect for serving or decoration. Made with high-quality clay and finished with a natural glaze.',
    price: 45.99,
    stock: 10,
    categoryName: 'Bowls',
    images: [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNjAiIGZpbGw9IiNFNUU3RUIiLz4KPHN2Zz4K'
    ]
  },
  {
    name: 'Modern Glass Vase',
    description: 'Elegant modern glass vase with clean lines. Perfect for displaying fresh flowers or as a standalone decorative piece.',
    price: 32.50,
    stock: 15,
    categoryName: 'Vases',
    images: [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjgwIiB5PSI0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzg5QjJGRiIvPgo8L3N2Zz4K'
    ]
  },
  {
    name: 'Artisan Dinner Plate',
    description: 'Handcrafted dinner plate with unique patterns. Made from premium ceramic material, microwave and dishwasher safe.',
    price: 28.75,
    stock: 20,
    categoryName: 'Plates',
    images: [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNzAiIGZpbGw9IiNGRkZGRkYiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI1MCIgZmlsbD0iI0Y5RkFGQiIvPgo8L3N2Zz4K'
    ]
  },
  {
    name: 'Ceramic Coffee Mug',
    description: 'Comfortable ceramic coffee mug with a modern design. Perfect for your morning coffee or tea. Holds 12oz of liquid.',
    price: 18.99,
    stock: 25,
    categoryName: 'Mugs',
    images: [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjYwIiB5PSI2MCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjEwMCIgcng9IjEwIiBmaWxsPSIjRkZGRkZGIi8+CjxyZWN0IHg9IjEzMCIgeT0iODAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI2MCIgcng9IjEwIiBmaWxsPSIjRkZGRkZGIi8+Cjwvc3ZnPgo='
    ]
  },
  {
    name: 'Abstract Sculpture',
    description: 'Unique abstract sculpture made from premium materials. A conversation piece that adds artistic flair to any space.',
    price: 89.99,
    stock: 5,
    categoryName: 'Sculptures',
    images: [
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNDBDMTIwIDQwIDE0MCA2MCAxNDAgODBDMTQwIDEwMCAxMjAgMTIwIDEwMCAxMjBDODAgMTIwIDYwIDEwMCA2MCA4MEM2MCA2MCA4MCA0MCAxMDAgNDBaIiBmaWxsPSIjNjM2NkY3Ii8+CjxwYXRoIGQ9Ik05MCAxMDBDOTAgOTAgMTAwIDgwIDExMCA4MEMxMjAgODAgMTMwIDkwIDEzMCAxMDBDMTMwIDExMCAxMjAgMTIwIDExMCAxMjBDMTAwIDEyMCA5MCAxMTAgOTAgMTAwWiIgZmlsbD0iI0U1RTdFQiIvPgo8L3N2Zz4K'
    ]
  }
];

async function main() {
  console.log('🌱 Seeding products...');
  
  // Get all categories
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));
  
  // Get all users to see what's available
  const allUsers = await prisma.user.findMany();
  console.log('📋 Available users:');
  allUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.role})`);
  });
  
  // Try to find an admin user - check both 'ADMIN' and 'admin'
  let defaultUser = await prisma.user.findFirst({
    where: { 
      OR: [
        { role: 'ADMIN' },
        { email: 'admin@bizzart.com' }
      ]
    }
  });
  
  if (!defaultUser) {
    console.log('❌ No admin user found. Using the first available user instead.');
    defaultUser = allUsers[0];
  }
  
  if (!defaultUser) {
    console.log('❌ No users found in database. Please create a user first.');
    return;
  }
  
  console.log(`✅ Using user: ${defaultUser.email} (${defaultUser.role})`);
  
  for (const productData of sampleProducts) {
    const categoryId = categoryMap.get(productData.categoryName);
    if (!categoryId) {
      console.log(`⚠️ Category "${productData.categoryName}" not found, skipping product: ${productData.name}`);
      continue;
    }
    
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        categoryId: categoryId,
        userId: defaultUser.id,
        images: {
          create: productData.images.map((url, index) => ({
            url: url,
            type: 'IMAGE',
            order: index
          }))
        }
      }
    });
    
    console.log(`✅ Created product: ${product.name} (${productData.categoryName}) - ₺${product.price}`);
  }
  
  console.log('✨ Product seeding completed!');
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 