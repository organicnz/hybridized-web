import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const report = await request.json();
  console.warn('CSP Violation:', JSON.stringify(report, null, 2));
  return NextResponse.json({ received: true });
}