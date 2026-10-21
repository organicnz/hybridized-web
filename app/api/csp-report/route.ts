import { type NextRequest, NextResponse } from "next/server";

/**
 * The CSP report endpoint.
 *
 * The browser posts a policy violation here. The body comes from whoever
 * posted it, so it is not trusted: a body that is not JSON is not a report,
 * and a body that is enormous is not a report either. Neither may take the
 * handler down — a 500 here would be reported as a broken endpoint rather
 * than as a rejected request.
 */

/** The largest report worth reading. A real one is a few hundred bytes. */
const MAX_REPORT_BYTES = 16 * 1024;

export async function POST(request: NextRequest) {
  const body = await request.text();

  if (body.length > MAX_REPORT_BYTES) {
    return NextResponse.json({ received: false }, { status: 413 });
  }

  let report: unknown;
  try {
    report = JSON.parse(body);
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }

  console.warn("CSP Violation:", JSON.stringify(report));

  return NextResponse.json({ received: true });
}
