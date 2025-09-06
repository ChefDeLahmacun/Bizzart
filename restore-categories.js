const categories = [
  { name: 'Vase', featured: true, order: 1 },
  { name: 'Bowl', featured: true, order: 2 },
  { name: 'Plate', featured: true, order: 3 },
  { name: 'Cup', featured: false, order: 4 },
  { name: 'Sculpture', featured: true, order: 5 },
  { name: 'Decorative', featured: false, order: 6 }
];

console.log('=== COPY THIS SQL TO SUPABASE SQL EDITOR ===');
console.log('-- Add categories');
categories.forEach(cat => {
  console.log(`INSERT INTO "Category" (id, name, featured, "order", "createdAt", "updatedAt") VALUES (gen_random_uuid(), '${cat.name}', ${cat.featured}, ${cat.order}, now(), now());`);
});
console.log('=== END SQL ===');
