import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { testEmail } from '@/lib/email';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await testEmail();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Email system is working correctly',
        details: result.message
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Email system test failed',
        error: result.error
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to test email system',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
