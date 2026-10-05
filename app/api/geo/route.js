import { NextResponse } from 'next/server';
import { getGeo } from '../../../lib/geo';

export async function GET() {
  try {
    return NextResponse.json(await getGeo(), { headers: { 'Cache-Control': 'public, s-maxage=86400' } });
  } catch {
    return NextResponse.json({ error: 'geo' }, { status: 503 });
  }
}
