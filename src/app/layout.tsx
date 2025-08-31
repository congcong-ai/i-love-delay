import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "i love delay",
  description: "反向任务管理应用 - 鼓励拖延，奖励借口！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}