"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Species = "貓" | "狗" | "其他";
type Kind = "memory" | "weight" | "daily";
type Pet = { id: string; name: string; species: Species; breed: string; birthday: string; weight_unit: "kg" | "g" | "lb" };
type Entry = {
  id: string; pet_id: string; kind: Kind; recorded_on: string; title: string; note: string;
  weight: number | null; food: string; water: string; toilet: string; activity: string;
  media_url: string; tags: string[];
};
type Backup = { format: "petlive-backup"; version: 1; exportedAt: string; pets: Pet[]; entries: Entry[] };

const STORAGE_KEY = "petlive.local-data.v1";
const today = () => new Date().toLocaleDateString("sv-SE");
const emptyPet = { name: "", species: "貓" as Species, breed: "", birthday: "", weight_unit: "kg" as Pet["weight_unit"] };
const emptyEntry = () => ({ kind: "memory" as Kind, recorded_on: today(), weight: "", title: "", note: "", food: "", water: "", toilet: "", activity: "", media_url: "", tags: "" });
const tips = [
  { species: "貓", stage: "全部", scene: "低溫保暖", title: "天冷時的保暖與用電安全", body: "提供乾燥、避風的休息處，讓毛孩能自行離開熱源。電暖器周圍保持安全距離，避免接觸、燙傷或啃咬電線。若出現持續顫抖、虛弱或行為異常，請聯繫獸醫。" },
  { species: "狗", stage: "全部", scene: "低溫保暖", title: "寒冷天氣的散步照護", body: "寒冷或潮濕時縮短戶外活動，回家擦乾身體並提供溫暖乾燥的休息處。若精神、食慾或活動明顯異常，請聯繫獸醫。" },
  { species: "全部", stage: "幼年", scene: "日常觀察", title: "建立生活紀錄", body: "固定記錄飲食、飲水、排泄與活動變化，有助於回顧日常。如有持續異常，請向獸醫諮詢。" },
  { species: "全部", stage: "全部", scene: "日常觀察", title: "留意日常變化", body: "持續記錄食慾、飲水、排泄及精神狀態，方便掌握變化。紀錄僅供生活照護參考，不能替代獸醫診斷。" },
];

export default function Home() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [petId, setPetId] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("總覽");
  const [scene, setScene] = useState("日常觀察");
  const [stage, setStage] = useState("全部");
  const [month, setMonth] = useState("全部月份");
  const [editing, setEditing] = useState(false);
  const [petForm, setPetForm] = useState(emptyPet);
  const [entryForm, setEntryForm] = useState(emptyEntry);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as { pets?: Pet[]; entries?: Entry[] };
        const safePets = Array.isArray(data.pets) ? data.pets : [];
        setPets(safePets);
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        if (safePets[0]) setPetId(safePets[0].id);
      }
    } catch {
      setNotice("本機資料無法讀取。你可以先匯入先前下載的 JSON 備份。");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ pets, entries }));
    } catch {
      setNotice("瀏覽器儲存空間不足，請匯出備份並移除大型或不需要的紀錄。");
    }
  }, [pets, entries, loaded]);

  const pet = pets.find((item) => item.id === petId);
  const allForPet = useMemo(() => entries.filter((item) => item.pet_id === petId), [entries, petId]);
  const months = useMemo(() => Array.from(new Set(allForPet.map((item) => item.recorded_on.slice(0, 7)))).sort().reverse(), [allForPet]);
  const monthEntries = allForPet.filter((item) => month === "全部月份" || item.recorded_on.startsWith(month));
  const weights = monthEntries.filter((item) => item.kind === "weight" && item.weight !== null).sort((a, b) => a.recorded_on.localeCompare(b.recorded_on)).map((item) => ({ date: item.recorded_on.slice(5), weight: Number(item.weight) }));
  const memories = monthEntries.filter((item) => item.kind !== "weight").sort((a, b) => b.recorded_on.localeCompare(a.recorded_on));
  const relatedTips = tips.filter((item) => (item.species === "全部" || item.species === pet?.species) && (item.scene === scene || item.scene === "日常觀察") && (stage === "全部" || item.stage === "全部" || item.stage === stage));

  function savePet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = petForm.name.trim();
    if (!name) return setNotice("請輸入毛孩名字。");
    if (editing && petId) {
      setPets((current) => current.map((item) => item.id === petId ? { ...petForm, name, id: petId } : item));
      setNotice("毛孩資料已更新並儲存在這台裝置。");
    } else {
      const created = { ...petForm, name, id: crypto.randomUUID() };
      setPets((current) => [created, ...current]);
      setPetId(created.id);
      setNotice("毛孩資料已儲存到這台裝置。");
    }
    setPetForm(emptyPet);
    setEditing(false);
  }

  function editPet() {
    if (!pet) return;
    setPetForm({ name: pet.name, species: pet.species, breed: pet.breed, birthday: pet.birthday, weight_unit: pet.weight_unit });
    setEditing(true);
    document.getElementById("pet-name")?.focus();
  }

  function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pet) return setNotice("請先新增毛孩資料。");
    if (entryForm.kind === "weight" && (!entryForm.weight || Number(entryForm.weight) <= 0)) return setNotice("請輸入大於 0 的體重。");
    if (entryForm.media_url && !/^https:\/\//i.test(entryForm.media_url.trim())) return setNotice("照片／影片連結請使用 HTTPS 網址。");
    const item: Entry = {
      ...entryForm,
      pet_id: pet.id,
      id: crypto.randomUUID(),
      recorded_on: entryForm.recorded_on || today(),
      title: entryForm.title.trim(),
      note: entryForm.note.trim(),
      weight: entryForm.kind === "weight" ? Number(entryForm.weight) : null,
      media_url: entryForm.media_url.trim(),
      tags: entryForm.tags.split(/[，,]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 12),
    };
    setEntries((current) => [item, ...current]);
    setEntryForm(emptyEntry());
    setNotice("紀錄已儲存到這台裝置。");
  }

  function exportBackup() {
    const backup: Backup = { format: "petlive-backup", version: 1, exportedAt: new Date().toISOString(), pets, entries };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `petlive-backup-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("備份檔已下載。");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Partial<Backup>;
      if (data.format !== "petlive-backup" || data.version !== 1 || !Array.isArray(data.pets) || !Array.isArray(data.entries)) throw new Error("FORMAT");
      setPets(data.pets);
      setEntries(data.entries);
      setPetId(data.pets[0]?.id ?? "");
      setMonth("全部月份");
      setNotice("備份已匯入；目前資料已由備份內容取代。");
    } catch {
      setNotice("無法匯入這個檔案。請選擇本系統下載的 JSON 備份。");
    } finally {
      event.target.value = "";
    }
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon">🐾</span><div><b>咪咪日常</b><small>毛孩成長照護簿</small></div></div>
      <div className="side-label">工作空間</div>
      {["總覽", "成長相簿", "體重紀錄", "生活日誌"].map((label, index) => <button className={`nav ${tab === label ? "active" : ""}`} onClick={() => { setTab(label); document.getElementById(["profile", "memories", "growth", "memories"][index])?.scrollIntoView({ behavior: "smooth" }); }} key={label}><span>{["⌂", "▧", "⌁", "☷"][index]}</span>{label}</button>)}
      <div className="pet-side"><div className="side-label">我的毛孩</div><select value={petId} onChange={(event) => { setPetId(event.target.value); setMonth("全部月份"); }} aria-label="選擇毛孩"><option value="">選擇毛孩</option>{pets.map((item) => <option key={item.id} value={item.id}>{item.species === "貓" ? "🐱" : "🐶"} {item.name}</option>)}</select><div className="pet-avatar">{pet?.species === "狗" ? "🐶" : pet?.species === "其他" ? "🐾" : "🐱"}</div><b>{pet?.name || "新朋友"}</b><small>{pet?.breed || "開始記錄美好日常"}</small></div>
      <div className="sidebar-foot">資料儲存在這台裝置的瀏覽器 ♡</div>
    </aside>

    <section className="main">
      <header className="top"><div><span className="eyebrow">PET CARE JOURNAL　·　{today()}</span><h1>{tab} <span className="wave">✦</span></h1><p>陪伴毛孩，好好記下每一個長大的瞬間。</p></div><div className="top-badge">☀️　美好的一天</div></header>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="關閉訊息">×</button></div>}

      <div className="content"><div className="column">
        <section className="card profile" id="profile"><div className="card-head"><div><span className="eyebrow">OUR LITTLE FAMILY</span><h2>毛孩小檔案</h2></div><span className="pill">{pets.length} 位家人</span></div>
          {pet ? <div className="profile-row"><div className="big-avatar">{pet.species === "狗" ? "🐶" : pet.species === "其他" ? "🐾" : "🐱"}</div><div className="profile-info"><h3>{pet.name} <span className="species">{pet.species}</span></h3><p>{pet.breed || "品種尚未填寫"}</p><p>生日　{pet.birthday || "尚未設定"}　·　體重單位 {pet.weight_unit}</p></div><button className="icon-btn" onClick={editPet} title="編輯毛孩資料">✎</button></div> : <p className="empty">建立第一份毛孩檔案，開始收藏成長日常。</p>}
          <form className="pet-form" onSubmit={savePet}><div className="form-title">{editing ? "✎ 編輯毛孩資料" : "＋ 新增毛孩"}</div><div className="pet-fields"><input id="pet-name" required maxLength={80} placeholder="名字" value={petForm.name} onChange={(event) => setPetForm({ ...petForm, name: event.target.value })}/><select value={petForm.species} onChange={(event) => setPetForm({ ...petForm, species: event.target.value as Species })}><option>貓</option><option>狗</option><option>其他</option></select><input maxLength={100} placeholder="品種（選填）" value={petForm.breed} onChange={(event) => setPetForm({ ...petForm, breed: event.target.value })}/><input type="date" aria-label="生日" max={today()} value={petForm.birthday} onChange={(event) => setPetForm({ ...petForm, birthday: event.target.value })}/><select value={petForm.weight_unit} onChange={(event) => setPetForm({ ...petForm, weight_unit: event.target.value as Pet["weight_unit"] })}><option value="kg">公斤 kg</option><option value="g">公克 g</option><option value="lb">磅 lb</option></select></div><div className="actions"><button className="button secondary">{editing ? "更新檔案" : "儲存檔案"}</button>{editing && <button type="button" className="button secondary" onClick={() => { setEditing(false); setPetForm(emptyPet); }}>取消</button>}</div>
          </form>
        </section>

        <section className="card chart-card" id="growth"><div className="card-head"><div><span className="eyebrow">GROWING UP</span><h2>體重成長曲線</h2></div><span className="pill">{weights.length} 筆紀錄</span></div>
          {weights.length ? <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={weights} margin={{ top: 12, right: 14, left: -18, bottom: 0 }}><CartesianGrid stroke="#eee8df" strokeDasharray="4 5"/><XAxis dataKey="date" tick={{ fontSize: 11, fill: "#92908c" }}/><YAxis tick={{ fontSize: 11, fill: "#92908c" }}/><Tooltip/><Line type="monotone" dataKey="weight" name={`體重 (${pet?.weight_unit || "kg"})`} stroke="#7b9c88" strokeWidth={3} dot={{ r: 4, fill: "#7b9c88", strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }}/></LineChart></ResponsiveContainer></div> : <div className="chart-empty"><span>📈</span><p>新增第一筆體重，成長曲線就會出現</p></div>}
          <form className="weight-form" onSubmit={(event) => { event.preventDefault(); setEntryForm((current) => ({ ...current, kind: "weight" })); const form = event.currentTarget; const weightInput = form.elements.namedItem("weight") as HTMLInputElement; const dateInput = form.elements.namedItem("weight-date") as HTMLInputElement; const noteInput = form.elements.namedItem("weight-note") as HTMLInputElement; if (!pet) return setNotice("請先新增毛孩資料。"); const value = Number(weightInput.value); if (!value || value <= 0) return setNotice("請輸入大於 0 的體重。"); setEntries((current) => [{ id: crypto.randomUUID(), pet_id: pet.id, kind: "weight", recorded_on: dateInput.value || today(), title: "", note: noteInput.value.trim(), weight: value, food: "", water: "", toilet: "", activity: "", media_url: "", tags: [] }, ...current]); form.reset(); setNotice("體重已儲存在這台裝置。"); }}><input name="weight" aria-label="體重" type="number" min="0.01" step="0.01" placeholder={`體重 (${pet?.weight_unit || "kg"})`} required/><input name="weight-date" aria-label="日期" type="date" defaultValue={today()}/><input name="weight-note" placeholder="備註（選填）"/><button className="button" disabled={!pet}>＋ 記體重</button></form>
        </section>

        <section className="card journal" id="memories"><div className="card-head"><div><span className="eyebrow">LITTLE MOMENTS</span><h2>{tab === "成長相簿" ? "成長相簿" : "生活日誌"}</h2></div><span className="pill">{memories.length} 篇紀錄</span></div>
          <form className="entry-form" onSubmit={saveEntry}><div className="form-grid"><select value={entryForm.kind} onChange={(event) => setEntryForm({ ...entryForm, kind: event.target.value as Kind })}><option value="memory">📸 成長回憶</option><option value="daily">☀️ 日常照護</option></select><input type="date" aria-label="紀錄日期" value={entryForm.recorded_on} onChange={(event) => setEntryForm({ ...entryForm, recorded_on: event.target.value })}/></div>
            {entryForm.kind === "weight" && <input type="number" min="0.01" step="0.01" placeholder={`體重 (${pet?.weight_unit || "kg"})`} value={entryForm.weight} onChange={(event) => setEntryForm({ ...entryForm, weight: event.target.value })}/>}
            <input maxLength={120} placeholder="今天的小故事標題" value={entryForm.title} onChange={(event) => setEntryForm({ ...entryForm, title: event.target.value })}/><textarea maxLength={2000} placeholder="寫下今天值得收藏的事⋯⋯" value={entryForm.note} onChange={(event) => setEntryForm({ ...entryForm, note: event.target.value })}/>
            <input type="url" placeholder="照片／影片 HTTPS 連結（雲端儲存網址）" value={entryForm.media_url} onChange={(event) => setEntryForm({ ...entryForm, media_url: event.target.value })}/><input maxLength={360} placeholder="標籤，以逗號分隔" value={entryForm.tags} onChange={(event) => setEntryForm({ ...entryForm, tags: event.target.value })}/>
            <div className="form-grid"><input maxLength={100} placeholder="進食量（選填）" value={entryForm.food} onChange={(event) => setEntryForm({ ...entryForm, food: event.target.value })}/><input maxLength={100} placeholder="飲水量（選填）" value={entryForm.water} onChange={(event) => setEntryForm({ ...entryForm, water: event.target.value })}/><input maxLength={200} placeholder="排泄狀況（選填）" value={entryForm.toilet} onChange={(event) => setEntryForm({ ...entryForm, toilet: event.target.value })}/><input maxLength={500} placeholder="精神／活動備註（選填）" value={entryForm.activity} onChange={(event) => setEntryForm({ ...entryForm, activity: event.target.value })}/></div>
            <button className="button" disabled={!pet}>收藏這一天　↗</button>
          </form>
          <div className="timeline-tools"><label>月份<select value={month} onChange={(event) => setMonth(event.target.value)}><option>全部月份</option>{months.map((value) => <option key={value}>{value}</option>)}</select></label><span>{monthEntries.length} 筆</span></div>
          <div className="timeline">{memories.map((item) => <article className="timeline-item" key={item.id}><div className="timeline-dot">{item.kind === "memory" ? "♡" : "☼"}</div><div className="timeline-body"><time>{item.recorded_on}</time><h3>{item.title || (item.kind === "memory" ? "一段成長回憶" : "日常照護紀錄")}</h3>{item.note && <p>{item.note}</p>}{item.media_url && <a href={item.media_url} target="_blank" rel="noreferrer">查看雲端媒體 ↗</a>}<div className="entry-meta">{item.food && <span>🍽 {item.food}</span>}{item.water && <span>💧 {item.water}</span>}{item.toilet && <span>🌿 {item.toilet}</span>}{item.activity && <span>☀ {item.activity}</span>}</div>{item.tags.length > 0 && <div className="tags">{item.tags.map((tag, index) => <span key={`${tag}-${index}`}>#{tag}</span>)}</div>}</div></article>)}{memories.length === 0 && <div className="timeline-empty">{monthEntries.length === 0 ? "這個月還沒有紀錄，寫下第一篇吧 ♡" : "這個月沒有生活／回憶紀錄。"}</div>}</div>
        </section>
      </div>

      <aside className="right"><section className="tip-card"><div className="tip-sun">☼</div><span className="eyebrow">GENTLE REMINDER</span><h2>給毛孩的小提醒</h2><p>選擇毛孩階段與照護情境，查看相關小知識。</p><label className="select-label">生命階段</label><select value={stage} onChange={(event) => setStage(event.target.value)}><option>全部</option><option>幼年</option><option>成年</option><option>高齡</option></select><label className="select-label">照護情境</label><select value={scene} onChange={(event) => setScene(event.target.value)}><option>日常觀察</option><option>低溫保暖</option></select>{relatedTips.map((item, index) => <article className="tip" key={index}><span className="tip-tag">{item.scene}　·　{item.species}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}<div className="disclaimer">以上為一般生活照護資訊，非醫療診斷。若有異常症狀，請洽獸醫師。</div></section>
        <section className="storage-note"><span>💾</span><div><b>本機資料與備份</b><p>紀錄存在這台裝置的瀏覽器。定期下載 JSON 備份，可在其他裝置匯入。</p><div className="backup-actions"><button className="button secondary" onClick={exportBackup}>下載備份</button><label className="button secondary file-button">匯入備份<input type="file" accept="application/json,.json" onChange={importBackup}/></label></div></div></section>
        <div className="footer-note">MADE WITH　<span>♥</span>　FOR EVERY PAW</div>
      </aside></div>
    </section>
  </main>;
}
