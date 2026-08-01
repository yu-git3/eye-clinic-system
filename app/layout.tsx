import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "眼科专科系统高保真原型",
  description: "HIHIS 眼科专科基础配置与业务功能交互原型",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
