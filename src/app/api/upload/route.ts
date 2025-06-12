import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { fileUploadService } from '@/lib/upload';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const folder = formData.get('folder') as string || 'products';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        return await fileUploadService.uploadFile(file, folder);
      })
    );

    const successfulUploads = uploadResults.filter(result => result.success);
    const failedUploads = uploadResults.filter(result => !result.success);

    if (failedUploads.length > 0) {
      return NextResponse.json({
        error: 'Some files failed to upload',
        successful: successfulUploads,
        failed: failedUploads
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: successfulUploads
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
