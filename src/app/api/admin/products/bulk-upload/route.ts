import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    // Read and parse CSV
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have at least a header and one data row' }, { status: 400 });
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1);

    // Validate headers
    const requiredHeaders = ['name', 'description', 'price', 'stock', 'categoryId'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      if (!row.trim()) continue;

      try {
        const values = parseCSVRow(row);
        const productData: any = {};

        // Map CSV values to product fields
        headers.forEach((header, index) => {
          if (values[index]) {
            switch (header) {
              case 'name':
                productData.name = values[index];
                break;
              case 'description':
                productData.description = values[index];
                break;
              case 'price':
                productData.price = parseFloat(values[index]);
                break;
              case 'stock':
                productData.stock = parseInt(values[index]);
                break;
              case 'categoryId':
                productData.categoryId = values[index];
                break;
              case 'height':
                productData.height = parseFloat(values[index]);
                break;
              case 'width':
                productData.width = parseFloat(values[index]);
                break;
              case 'depth':
                productData.depth = parseFloat(values[index]);
                break;
              case 'diameter':
                productData.diameter = parseFloat(values[index]);
                break;
              case 'weight':
                productData.weight = parseFloat(values[index]);
                break;
              case 'colors':
                productData.colors = values[index].split(',').map(c => c.trim()).filter(c => c);
                break;
            }
          }
        });

        // Validate required fields
        if (!productData.name || !productData.description || !productData.price || !productData.stock || !productData.categoryId) {
          throw new Error(`Row ${i + 2}: Missing required fields`);
        }

        // Validate category exists
        const category = await prisma.category.findUnique({
          where: { id: productData.categoryId }
        });

        if (!category) {
          throw new Error(`Row ${i + 2}: Category ID '${productData.categoryId}' not found`);
        }

        // Create product
        await prisma.product.create({
          data: {
            ...productData,
            userId: session.user.id,
          }
        });

        successful++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : `Row ${i + 2}: Unknown error`;
        errors.push(errorMessage);
      }
    }

    const total = dataRows.length;
    const message = failed === 0 
      ? `Successfully uploaded ${successful} products!`
      : `Upload completed with ${successful} successful and ${failed} failed products.`;

    return NextResponse.json({
      success: failed === 0,
      message,
      details: {
        total,
        successful,
        failed,
        errors: errors.slice(0, 10) // Limit errors to first 10
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to process bulk upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to parse CSV rows (handles quoted values with commas)
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}
