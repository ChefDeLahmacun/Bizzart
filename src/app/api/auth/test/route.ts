import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    nextAuthUrl: process.env.NEXTAUTH_URL,
  };

  return NextResponse.json({
    message: 'Auth configuration check',
    envCheck,
    timestamp: new Date().toISOString(),
  });
}
