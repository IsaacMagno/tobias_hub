import { NextResponse } from "next/server";
import { runDailyQuestsCron } from "@/lib/services/quests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await runDailyQuestsCron();
  return NextResponse.json({ ok: true });
}
