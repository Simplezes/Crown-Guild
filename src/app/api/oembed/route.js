import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  return NextResponse.json({
    type: "photo",
    version: "1.0",
    provider_name: "Crown Guild",
    provider_url: process.env.NEXTAUTH_URL,
    url: imageUrl,
    width: 1200,
    height: 630
  });
}
