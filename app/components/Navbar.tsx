"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNotifications } from "../contexts/NotificationContext";

const RECENT_ALERTS_COUNT = 5;

/** 상단 바: 종 아이콘(알림) + 사용자 정보 */
export default function Navbar() {
  const { alerts, unreadCount, markAllRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasNewNotifications = unreadCount > 0;
  const recentAlerts = alerts.slice(0, RECENT_ALERTS_COUNT);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    markAllRead();
    setShowDropdown(false);
  };

  const equipmentHref = (equipmentName: string) =>
    `/equipment/${encodeURIComponent(equipmentName)}`;

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 bg-white border-b border-slate-200">
      <h1 className="text-lg font-semibold text-slate-800">
        ICCU 품질 분석 대시보드
      </h1>

      <div className="flex items-center gap-4">
        {/* 종 모양 알림 아이콘 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
            aria-label="알림"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {hasNewNotifications && (
              <span
                className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"
                aria-hidden
              />
            )}
          </button>

          {/* 알림 Popover - 최근 5개 */}
          {showDropdown && (
            <div className="absolute right-0 mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                <span className="font-semibold text-slate-800">알림</span>
                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    모두 읽음
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {recentAlerts.length > 0 ? (
                  recentAlerts.map((a) => (
                    <Link
                      key={a.id}
                      href={equipmentHref(a.equipmentName)}
                      onClick={() => setShowDropdown(false)}
                      className="block p-3 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-800">{a.message}</p>
                      {a.aiInsight && (
                        <p className="text-xs text-amber-700 mt-1 pl-2 border-l-2 border-amber-400 bg-amber-50/50 py-1 rounded">
                          {a.aiInsight}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(a.timestamp).toLocaleString("ko-KR")}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm">
                    새 알림이 없습니다
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 사용자 정보 */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
            A
          </div>
          <span className="text-sm font-medium text-slate-700">관리자</span>
        </div>
      </div>
    </header>
  );
}
