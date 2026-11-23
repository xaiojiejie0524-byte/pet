import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isoDate, number, tags, text } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url); const pet = text(searchParams.get("pet"), 50);
  if (!pet) return NextResponse.json({ error: "缺少寵物識別碼。" }, { status: 400 });
  try { const r = await query("SELECT id,pet_id,kind,recorded_on,title,note,weight,food,water,toilet,activity,media_url,tags FROM entries WHERE pet_id=$1 ORDER BY recorded_on DESC,created_at DESC", [pet]); return NextResponse.json(r.rows); }
  catch { return NextResponse.json({ error: "無法讀取紀錄，請確認資料庫設定。" }, { status: 503 }); }
}
export async function POST(req: Request) {
  try {
    const b = await req.json(); const pet = text(b.pet_id, 50); const kind = ["memory","weight","daily"].includes(b.kind) ? b.kind : null; const date = isoDate(b.recorded_on);
    if (!pet || !kind || !date) return NextResponse.json({ error: "請提供寵物、紀錄類型與有效日期。" }, { status: 400 });
    const weight = b.weight === "" || b.weight == null ? null : number(b.weight, 0.01, 1000);
    if (kind === "weight" && weight === null) return NextResponse.json({ error: "體重需為 0.01 至 1000 間的數字。" }, { status: 400 });
    const title = text(b.title || "", 120) ?? ""; const note = text(b.note || "", 2000) ?? "";
    const media = b.media_url ? text(b.media_url, 2000) : null;
    if (b.media_url && (!media || !/^https:\/\//i.test(media))) return NextResponse.json({ error: "媒體連結需使用 HTTPS。" }, { status: 400 });
    const r = await query("INSERT INTO entries(pet_id,kind,recorded_on,title,note,weight,food,water,toilet,activity,media_url,tags) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *", [pet,kind,date,title,note,weight,text(b.food,100)??"",text(b.water,100)??"",text(b.toilet,200)??"",text(b.activity,500)??"",media,tags(b.tags)]);
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch { return NextResponse.json({ error: "新增紀錄失敗，請確認寵物與資料庫設定。" }, { status: 503 }); }
}
