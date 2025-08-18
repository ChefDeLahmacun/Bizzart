import { NextResponse } from 'next/server';

export async function GET() {
  const connectionInfo = {
    databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set',
    directUrl: process.env.DIRECT_URL ? 'Set' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  // Try to parse the connection string to see what we're working with
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      connectionInfo.host = url.hostname;
      connectionInfo.port = url.port;
      connectionInfo.hasPgbouncer = process.env.DATABASE_URL.includes('pgbouncer=true');
    } catch (error) {
      connectionInfo.parseError = 'Failed to parse DATABASE_URL';
    }
  }

  return NextResponse.json({
    message: 'Connection configuration check',
    connectionInfo,
  });
}
