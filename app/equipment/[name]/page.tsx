"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

/** 장비 상세 페이지 (알림 클릭 시 이동) */
export default function EquipmentDetailPage() {
  const params = useParams();
  const name = typeof params.name === "string" ? decodeURIComponent(params.name) : "알 수 없음";

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link
          href="/"
          className="text-blue-600 hover:underline text-sm"
        >
          ← 대시보드로 돌아가기
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        {name} 상세 정보
      </h1>
      <p className="text-slate-600 mb-6">
        장비 모니터링 및 차트가 여기에 표시됩니다.
      </p>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
        차트·센서 데이터 연동 영역
      </div>
    </div>
  );
}
