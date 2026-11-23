import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isoDate, text } from "@/lib/validation";
export const runtime = "nodejs";
export async function GET() {
  try { const r = await query("SELECT id,name,species,breed,birthday,weight_unit FROM pets ORDER BY created_at DESC"); return NextResponse.json(r.rows); }
  catch { return NextResponse.json({ error: "無法讀取寵物資料，請確認資料庫設定與 schema。" }, { status: 503 }); }
}
export async function POST(req: Request) {
  try {
    const b = await req.json(); const name = text(b.name, 80); const species = ["貓","狗","其他"].includes(b.species) ? b.species : null;
    if (!name || !species) return NextResponse.json({ error: "請提供名稱與有效物種。" }, { status: 400 });
    const breed = text(b.breed || "", 100) ?? ""; const unit = ["kg","g","lb"].includes(b.weight_unit) ? b.weight_unit : "kg";
    const birthday = b.birthday ? isoDate(b.birthday) : null;
    if (b.birthday && !birthday) return NextResponse.json({ error: "生日需為有效日期。" }, { status: 400 });
    const r = await query("INSERT INTO pets(name,species,breed,birthday,weight_unit) VALUES($1,$2,$3,$4,$5) RETURNING id,name,species,breed,birthday,weight_unit", [name,species,breed,birthday,unit]);
    return NextResponse.json(r.rows[0], { status: 201 });
  } catch { return NextResponse.json({ error: "新增失敗，請檢查資料庫設定與輸入資料。" }, { status: 503 }); }
}

export async function PATCH(req: Request) {
  try {
    const b = await req.json();
    const id = text(b.id, 50);
    const name = text(b.name, 80);
    const species = ["貓", "狗", "其他"].includes(b.species) ? b.species : null;
    if (!id || !name || !species) return NextResponse.json({ error: "請提供有效的寵物識別碼、名稱與物種。" }, { status: 400 });
    const breed = text(b.breed || "", 100) ?? "";
    const unit = ["kg", "g", "lb"].includes(b.weight_unit) ? b.weight_unit : "kg";
    const birthday = b.birthday ? isoDate(b.birthday) : null;
    if (b.birthday && !birthday) return NextResponse.json({ error: "生日需為有效日期。" }, { status: 400 });
    const r = await query("UPDATE pets SET name=$2,species=$3,breed=$4,birthday=$5,weight_unit=$6 WHERE id=$1 RETURNING id,name,species,breed,birthday,weight_unit", [id, name, species, breed, birthday, unit]);
    if (!r.rowCount) return NextResponse.json({ error: "找不到這筆寵物資料。" }, { status: 404 });
    return NextResponse.json(r.rows[0]);
  } catch {
    return NextResponse.json({ error: "更新失敗，請檢查資料庫設定與輸入資料。" }, { status: 503 });
  }
}
