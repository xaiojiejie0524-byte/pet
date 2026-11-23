import type { Metadata } from "next";
import "./style.css";
import "./local-storage.css";
export const metadata: Metadata = { title: "咪咪日常｜寵物成長與照護", description: "記錄毛孩的成長、生活與照護日常" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="zh-Hant"><body>{children}</body></html>; }
