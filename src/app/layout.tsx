import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kobai-walk — 勾配降下の地形歩き",
  description:
    "損失地形の等高線の上を、勾配降下・モメンタム・AdaGrad の 3 走者が谷底へ降りていく過程をレース形式で可視化する教材アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
