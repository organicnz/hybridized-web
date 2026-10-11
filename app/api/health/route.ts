import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "unknown";
  let dbLatency = 0;

  try {
    const supabase = await createClient();
    const dbStart = Date.now();
    const { error } = await supabase.from("bands").select("id").limit(1);
    dbLatency = Date.now() - dbStart;
    dbStatus = error ? "error" : "connected";
  } catch {
    dbStatus = "error";
  }

  const totalLatency = Date.now() - startTime;

  const isHealthy = dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      latencyMs: totalLatency,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
