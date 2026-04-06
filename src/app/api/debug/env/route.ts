import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID ?? '(not set)',
    INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI ?? '(not set)',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? '(not set)',
    NODE_ENV: process.env.NODE_ENV ?? '(not set)',
  });
}
