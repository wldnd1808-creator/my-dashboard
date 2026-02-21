"use client";

import { useState, useEffect, useRef } from "react";
import { useNotifications } from "../contexts/NotificationContext";

/** 컨텍스트에 알림이 없을 때 보여줄 테스트용 더미 (빨간 점 + 팝업 내용 보장) */
const FALLBACK_DEMO = {
  id: "fallback-demo",
  message: "[ICCU 모니터] 온도 82도 이상 발생 - 즉시 확인 필요",
  equipmentName: "ICCU 모니터",
  type: "temperature" as const,
  value: 82,
  timestamp: Date.now(),
  aiInsight: "과거 데이터 패턴 분석 결과, 30분 내 과열로 인한 정지 확률 64%입니다.",
};

export default function Navbar() {
  const { alerts, unreadCount, markAllRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const recentAlerts = alerts.slice(0, 5);
  const displayList = recentAlerts.length > 0 ? recentAlerts : [FALLBACK_DEMO];
  const showBadge = unreadCount > 0 || alerts.length === 0;

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
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-50 w-full shrink-0">
      <div className="flex items-center min-w-0">
        <h1 className="text-xl font-bold text-slate-800 truncate">ICCU 품질 분석</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* 1. 알림 아이콘 버튼 영역 - 항상 렌더, 조건 없음 */}
        <div className="relative flex items-center justify-center" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label="알림"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {showBadge && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" aria-hidden />
            )}
          </button>

          {/* 알림 드롭다운 */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden z-[100]">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-sm font-semibold text-slate-700">최근 알림</span>
                {(unreadCount > 0 || alerts.length === 0) && (
                  <button onClick={() => { markAllRead(); setShowDropdown(false); }} className="text-xs text-blue-600 hover:underline">모두 읽음</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {displayList.length > 0 ? (
                  displayList.map((a) => (
                    <div key={a.id} className="p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                      <p className="text-sm text-slate-800 leading-snug">{a.message}</p>
                      {a.aiInsight && (
                        <p className="text-xs text-amber-700 mt-1 pl-2 border-l-2 border-amber-400 bg-amber-50/50 py-1 rounded">
                          {a.aiInsight}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">{new Date(a.timestamp).toLocaleString("ko-KR")}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">새 알림이 없습니다</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 2. 사용자 정보 영역 (구분선 포함) */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">A</div>
          <span className="text-sm font-medium text-slate-700">관리자</span>
        </div>
      </div>
    </header>
  );
}