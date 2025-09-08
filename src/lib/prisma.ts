// This file is a stub to prevent build errors
// The project now uses Supabase instead of Prisma
// All API routes should be updated to use Supabase

export const prisma = {
  // Stub methods to prevent runtime errors
  order: {
    count: () => Promise.resolve(0),
    aggregate: () => Promise.resolve({ _sum: { totalAmount: 0 } }),
    groupBy: () => Promise.resolve([]),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  user: {
    count: () => Promise.resolve(0),
    groupBy: () => Promise.resolve([]),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  product: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  category: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  orderItem: {
    count: () => Promise.resolve(0),
    groupBy: () => Promise.resolve([]),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  image: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  address: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  review: {
    count: () => Promise.resolve(0),
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  },
  $disconnect: () => Promise.resolve()
};
