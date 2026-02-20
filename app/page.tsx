"use client";

import { useEffect, useState, useMemo } from "react";
import type { IccuRow } from "@/types/iccu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from "recharts";

const MODEL_OPTIONS = ["전체", "아이오닉5", "EV6"];
const SUPPLIER_OPTIONS = ["전체", "A사", "B사"];

function filterData(
  data: IccuRow[],
  model: string,
  supplier: string
): IccuRow[] {
  let out = data;
  if (model !== "전체") out = out.filter((r) => r.모델명 === model);
  if (supplier !== "전체") out = out.filter((r) => r.협력사 === supplier);
  return out;
}

function computeHistogramBins(failedKm: number[], nbins: number = 20) {
  if (failedKm.length === 0) return [];
  const min = Math.min(...failedKm);
  const max = Math.max(...failedKm);
  const step = (max - min) / nbins || 1;
  const bins: { range: string; count: number; mid: number }[] = [];
  for (let i = 0; i < nbins; i++) {
    const lo = min + i * step;
    const hi = min + (i + 1) * step;
    const count = failedKm.filter((v) => v >= lo && (i === nbins - 1 ? v <= hi : v < hi)).length;
    bins.push({
      range: `${Math.round(lo)}~${Math.round(hi)}`,
      count,
      mid: (lo + hi) / 2,
    });
  }
  return bins;
}

export default function DashboardPage() {
  const [data, setData] = useState<IccuRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState("전체");
  const [supplier, setSupplier] = useState("전체");

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setData(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterData(data, model, supplier),
    [data, model, supplier]
  );
  const failed = useMemo(
    () => filtered.filter((r) => r.고장),
    [filtered]
  );

  const total = filtered.length;
  const claims = failed.length;
  const claimRate = total > 0 ? (claims / total) * 100 : 0;
  const earlyFail =
    failed.length > 0
      ? failed.filter((r) => r["주행거리(km)"] <= 10000).length
      : 0;
  const totalCost = filtered.reduce((s, r) => s + r.수리비용, 0);
  const avgKmFailed =
    failed.length > 0
      ? failed.reduce((s, r) => s + r["주행거리(km)"], 0) / failed.length
      : 0;

  const filterLabel = [model !== "전체" && model, supplier !== "전체" && supplier]
    .filter(Boolean)
    .join(" · ");
  const filterText = filterLabel || "전체";

  const histogramData = useMemo(() => {
    const km = failed.map((r) => r["주행거리(km)"]).filter((v) => Number.isFinite(v));
    return computeHistogramBins(km, 20);
  }, [failed]);

  const monthSupplierCounts = useMemo(() => {
    const keyCount: Record<string, { 생산월: string; A사: number; B사: number }> = {};
    failed.forEach((r) => {
      const m = r.생산월;
      if (!keyCount[m]) keyCount[m] = { 생산월: m, A사: 0, B사: 0 };
      if (r.협력사 === "A사") keyCount[m].A사 += 1;
      else keyCount[m].B사 += 1;
    });
    return Object.values(keyCount).sort(
      (a, b) => a.생산월.localeCompare(b.생산월)
    );
  }, [failed]);

  const scatterData = useMemo(() => {
    return filtered
      .filter(
        (r) =>
          Number.isFinite(r.외기온도) && Number.isFinite(r["주행거리(km)"])
      )
      .map((r) => ({
        x: r.외기온도,
        y: r["주행거리(km)"],
        name: r.고장 ? "고장(Y)" : "정상(N)",
      }));
  }, [filtered]);

  const tempRateData = useMemo(() => {
    const withTemp = filtered.filter((r) => Number.isFinite(r.외기온도));
    const bucket: Record<number, { fail: number; total: number }> = {};
    withTemp.forEach((r) => {
      const band = Math.floor(r.외기온도 / 5) * 5;
      if (!bucket[band]) bucket[band] = { fail: 0, total: 0 };
      bucket[band].total += 1;
      if (r.고장) bucket[band].fail += 1;
    });
    return Object.entries(bucket)
      .map(([k, v]) => ({
        온도구간: Number(k),
        "고장률(%)": v.total > 0 ? (v.fail / v.total) * 100 : 0,
      }))
      .sort((a, b) => a.온도구간 - b.온도구간);
  }, [filtered]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">데이터 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-800 text-white p-4 flex flex-col gap-4">
        <h2 className="font-semibold text-lg">필터</h2>
        <p className="text-slate-300 text-sm">
          선택한 조건에 따라 KPI·차트가 실시간 반영됩니다.
        </p>
        <label className="text-sm font-medium">모델명</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
        >
          {MODEL_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <label className="text-sm font-medium">협력사</label>
        <select
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          className="w-full rounded-lg bg-slate-700 border border-slate-600 text-white px-3 py-2"
        >
          {SUPPLIER_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <div className="border-t border-slate-600 pt-4 mt-2">
          <p className="text-slate-400 text-sm">적용 후 차량 수</p>
          <p className="text-2xl font-semibold">{filtered.length}대</p>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold text-slate-900">
          ICCU 품질 분석 대시보드
        </h1>
        <p className="text-slate-600 mb-6">
          현대/기아 ICCU 결함 가상 데이터 기반 시각화 · <strong>필터: {filterText}</strong>
        </p>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3">
            선택한 조건에 해당하는 데이터가 없습니다. 필터를 변경해 주세요.
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: "전체 클레임율",
                  value: `${claimRate.toFixed(1)}%`,
                },
                {
                  label: "1만km 이내 조기 고장 (IQS)",
                  value: `${earlyFail}건`,
                },
                {
                  label: "총 누적 수리 비용 (AS Cost)",
                  value: `${(totalCost / 1e8).toFixed(2)}억 원`,
                },
                {
                  label: "고장 차량 평균 주행거리",
                  value:
                    total > 0
                      ? `${avgKmFailed.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} km`
                      : "0 km",
                },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="border-2 border-blue-600 rounded-xl p-4 bg-slate-50 shadow-sm"
                >
                  <p className="text-sm text-slate-600">{kpi.label}</p>
                  <p className="text-xl font-semibold text-slate-900 mt-1">
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            <hr className="border-slate-200 my-6" />

            {/* Chart 1: Histogram */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                1. 주행거리별 고장 빈도 히스토그램 (1만km 미만 집중도)
              </h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="고장 건수" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                1만km 기준선: 빨간 점선 (차트 상 구간 참고)
              </p>
            </section>

            {/* Chart 2: 생산월별/협력사별 */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                2. 생산월별/협력사별 고장 발생 건수 (특정 LOT 확인)
              </h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthSupplierCounts}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="생산월" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="A사" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="B사" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Chart 3: 외기온도 vs 주행거리 scatter + 온도구간별 고장률 */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                3. 외기온도와 고장 발생 관계
              </h2>
              <p className="text-sm text-slate-600 mb-2">
                외기온도 vs 주행거리 (색: 고장 여부)
              </p>
              <div className="h-[380px] w-full mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="x" name="외기온도" unit="°C" />
                    <YAxis type="number" dataKey="y" name="주행거리(km)" />
                    <ZAxis range={[100, 400]} />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <ReferenceLine y={10000} stroke="#b91c1c" strokeDasharray="4 4" />
                    <Scatter name="정상(N)" data={scatterData.filter((d) => d.name === "정상(N)")} fill="#94a3b8" />
                    <Scatter name="고장(Y)" data={scatterData.filter((d) => d.name === "고장(Y)")} fill="#dc2626" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-slate-600 mb-2">온도 구간별 고장 발생률 (%)</p>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tempRateData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="온도구간" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="고장률(%)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <hr className="border-slate-200 my-6" />

            {/* Quality Report */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                품질 분석 결과
              </h2>
              <details open className="rounded-lg border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer font-medium text-slate-700">
                  현상 · 원인 · 개선안 · 기대효과
                </summary>
                <div className="mt-4 prose prose-slate max-w-none text-sm">
                  {supplier === "A사" && (
                    <ReportA
                      claimRate={claimRate}
                      earlyFail={earlyFail}
                      avgKmFailed={avgKmFailed}
                      totalCost={totalCost}
                    />
                  )}
                  {supplier === "B사" && (
                    <ReportB
                      claimRate={claimRate}
                      earlyFail={earlyFail}
                      avgKmFailed={avgKmFailed}
                      totalCost={totalCost}
                    />
                  )}
                  {supplier === "전체" && (
                    <ReportAll
                      claimRate={claimRate}
                      earlyFail={earlyFail}
                      avgKmFailed={avgKmFailed}
                      totalCost={totalCost}
                      claims={claims}
                    />
                  )}
                </div>
              </details>
            </section>

            {/* Data table */}
            <section className="mb-8">
              <details className="rounded-lg border border-slate-200 bg-white">
                <summary className="cursor-pointer p-4 font-medium text-slate-700">
                  원본 데이터 (CSV 미리보기)
                </summary>
                <div className="overflow-auto max-h-[300px] p-4">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-slate-100">
                      <tr>
                        <th className="border border-slate-200 px-2 py-1 text-left">차량ID</th>
                        <th className="border border-slate-200 px-2 py-1 text-left">모델명</th>
                        <th className="border border-slate-200 px-2 py-1 text-left">생산일자</th>
                        <th className="border border-slate-200 px-2 py-1 text-right">주행거리(km)</th>
                        <th className="border border-slate-200 px-2 py-1 text-left">고장발생여부</th>
                        <th className="border border-slate-200 px-2 py-1 text-left">협력사</th>
                        <th className="border border-slate-200 px-2 py-1 text-left">고장코드(DTC)</th>
                        <th className="border border-slate-200 px-2 py-1 text-right">수리비용</th>
                        <th className="border border-slate-200 px-2 py-1 text-right">외기온도</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={r.차량ID + i}>
                          <td className="border border-slate-200 px-2 py-1">{r.차량ID}</td>
                          <td className="border border-slate-200 px-2 py-1">{r.모델명}</td>
                          <td className="border border-slate-200 px-2 py-1">{r.생산일자}</td>
                          <td className="border border-slate-200 px-2 py-1 text-right">{r["주행거리(km)"].toLocaleString()}</td>
                          <td className="border border-slate-200 px-2 py-1">{r.고장발생여부}</td>
                          <td className="border border-slate-200 px-2 py-1">{r.협력사}</td>
                          <td className="border border-slate-200 px-2 py-1">{r["고장코드(DTC)"]}</td>
                          <td className="border border-slate-200 px-2 py-1 text-right">{r.수리비용.toLocaleString()}</td>
                          <td className="border border-slate-200 px-2 py-1 text-right">{r.외기온도}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>

            <p className="text-slate-500 text-sm">
              데이터: iccu_defect_analysis_data.csv | 프레임워크: Next.js
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function ReportA({
  claimRate,
  earlyFail,
  avgKmFailed,
  totalCost,
}: {
  claimRate: number;
  earlyFail: number;
  avgKmFailed: number;
  totalCost: number;
}) {
  return (
    <div className="space-y-3">
      <div>
        <strong>1. 현상 — A사 공급분에서의 문제 집중</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>A사</strong> 공급 ICCU에서 <strong>1만 km 미만 조기 고장</strong>이 두드러집니다. 고장 차량 평균 주행거리 약 <strong>{avgKmFailed.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} km</strong> (IQS 구간).</li>
          <li>A사 기준 클레임율 <strong>{claimRate.toFixed(1)}%</strong>, 1만 km 이내 조기 고장 <strong>{earlyFail}건</strong>으로, 협력사 중 상대적으로 고장률이 높은 편입니다.</li>
        </ul>
      </div>
      <div>
        <strong>2. 원인 — A사 특정 로트·공정 이슈</strong>
        <ul className="list-disc pl-6 mt-1">
          <li>A사 단독 필터에서도 특정 생산월(2025년 10월 등) 구간에서 고장이 급증하는 패턴이 확인됩니다.</li>
          <li>부품 로트·공정 불량 또는 설계 검증 미흡 가능성이 있으며, A사 측 품질 관리 강화가 시급합니다.</li>
        </ul>
      </div>
      <div>
        <strong>3. 개선안 (A사 대상)</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>선별 리콜</strong>: A사·해당 생산월 대상 특정이 가능하므로, 하드웨어 결함 시 선별 리콜 우선 검토.</li>
          <li><strong>A사 공급사 품질 감사 및 4M(인력·자재·방법·설비) 점검</strong> 권장.</li>
          <li>OTA는 모니터링·경고 보완용으로 병행.</li>
        </ul>
      </div>
      <div>
        <strong>4. 기대효과</strong>
        <p className="mt-1">현재 A사 구간 누적 수리비용 약 <strong>{(totalCost / 1e4).toFixed(1)}만 원</strong>. 동일 패턴 재발 방지 시 AS 비용 절감 및 브랜드 신뢰도 개선 기대.</p>
      </div>
    </div>
  );
}

function ReportB({
  claimRate,
  earlyFail,
  avgKmFailed,
  totalCost,
}: {
  claimRate: number;
  earlyFail: number;
  avgKmFailed: number;
  totalCost: number;
}) {
  return (
    <div className="space-y-3">
      <div>
        <strong>1. 현상 — B사 공급분 품질 개요</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>B사</strong> 공급 ICCU는 A사 대비 조기 고장·클레임 건수가 상대적으로 낮은 편입니다.</li>
          <li>B사 기준 클레임율 <strong>{claimRate.toFixed(1)}%</strong>, 1만 km 이내 조기 고장 <strong>{earlyFail}건</strong>, 고장 차량 평균 주행거리 약 <strong>{avgKmFailed.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} km</strong>.</li>
        </ul>
      </div>
      <div>
        <strong>2. 원인 — B사에서의 주의점</strong>
        <ul className="list-disc pl-6 mt-1">
          <li>B사 단독으로는 특정 생산월·로트에서의 집중 이슈가 A사만큼 뚜렷하지 않을 수 있으나, 저온/고온 구간 등 사용 환경에 따른 고장은 지속 모니터링이 필요합니다.</li>
        </ul>
      </div>
      <div>
        <strong>3. 개선안 (B사 대상)</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>예방적 품질 관리 유지</strong>: 현재 수준 유지를 위한 공정 관리 및 출하 검사 강화.</li>
          <li><strong>환경 시험(저온/고온) 강화</strong>로 극한 조건에서의 고장 가능성 선제 점검.</li>
        </ul>
      </div>
      <div>
        <strong>4. 기대효과</strong>
        <p className="mt-1">B사 구간 누적 수리비용 약 <strong>{(totalCost / 1e4).toFixed(1)}만 원</strong>. 안정적 품질 유지 시 고객 만족도 및 리콜 리스크 최소화 기대.</p>
      </div>
    </div>
  );
}

function ReportAll({
  claimRate,
  earlyFail,
  avgKmFailed,
  totalCost,
  claims,
}: {
  claimRate: number;
  earlyFail: number;
  avgKmFailed: number;
  totalCost: number;
  claims: number;
}) {
  return (
    <div className="space-y-3">
      <div>
        <strong>1. 현상 (어느 구간에서 문제가 집중되는가?)</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>1만 km 미만</strong>에서 고장 집중. 고장 차량 평균 주행거리 약 <strong>{avgKmFailed.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} km</strong> (IQS 구간).</li>
          <li>전체 클레임율 <strong>{claimRate.toFixed(1)}%</strong>, 1만 km 이내 조기 고장 <strong>{earlyFail}건</strong>.</li>
        </ul>
      </div>
      <div>
        <strong>2. 원인 (특정 협력사·생산 시점인가?)</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>협력사 A사</strong> 공급분에서 고장 다수.</li>
          <li><strong>2025년 10월 생산분</strong>에서 고장 건수 급증.</li>
          <li><strong>A사 + 2025년 10월 로트</strong>가 원인으로 추정.</li>
        </ul>
      </div>
      <div>
        <strong>3. 개선안 (OTA vs 리콜)</strong>
        <ul className="list-disc pl-6 mt-1">
          <li><strong>선별 리콜 우선</strong>: A사·2025-10 대상 특정 가능, 하드웨어 결함 가능성 높음.</li>
          <li><strong>OTA</strong>는 모니터링·경고 보완용.</li>
          <li><strong>선별 리콜 + OTA 보완</strong> 전략 권장.</li>
        </ul>
      </div>
      <div>
        <strong>4. 기대효과 (AS 비용 절감)</strong>
        <p className="mt-1">
          현재: 총 수리비용 약 <strong>{(totalCost / 1e4).toFixed(1)}만 원</strong>
          {claims > 0 && <> · 건당 평균 약 <strong>{(totalCost / claims / 1e4).toFixed(1)}만 원</strong> (고장 건 기준)</>}.
          동일 패턴 재발 방지 시 연간 AS 비용 절감 및 품질 신뢰도 개선 기대.
        </p>
      </div>
    </div>
  );
}
