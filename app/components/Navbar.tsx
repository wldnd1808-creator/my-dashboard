"use client";

import { useState, useEffect, useRef } from "react";
import { useNotifications } from "../contexts/NotificationContext";

export default function Navbar() {
  const { alerts, unreadCount, markAllRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const recentAlerts = alerts.slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-slate-800">ICCU 품질 분석</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* 알림 아이콘 버튼 */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {/* 알림 드롭다운 */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">최근 알림</span>
                <button onClick={() => { markAllRead(); setShowDropdown(false); }} className="text-xs text-blue-600 hover:underline">모두 읽음</button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((a) => (
                    <div key={a.id} className="p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <p className="text-sm text-slate-800">{a.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(a.timestamp).toLocaleString("ko-KR")}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">새 알림이 없습니다</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">A</div>
          <span className="text-sm font-medium text-slate-700">관리자</span>
        </div>
      </div>
    </header>
  );
}