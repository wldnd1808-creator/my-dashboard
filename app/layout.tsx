import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import { NotificationProvider } from "./contexts/NotificationContext";

export const metadata: Metadata = {
  title: "ICCU 품질 분석 대시보드",
  description: "현대/기아 ICCU 결함 가상 데이터 기반 시각화",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <NotificationProvider>
          <Navbar />
          <div className="flex flex-1 min-h-0">{children}</div>
        </NotificationProvider>
      </body>
    </html>
  );
}
