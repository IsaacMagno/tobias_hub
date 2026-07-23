import { NextResponse } from "next/server";
import { syncQuotesFromPensador } from "@/lib/services/syncQuotes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await syncQuotesFromPensador();
  return NextResponse.json({ ok: true, ...result });
}
