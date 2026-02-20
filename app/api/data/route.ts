import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { IccuRow } from "@/types/iccu";

function parseNum(str: string): number {
  if (str == null || str === "") return 0;
  const cleaned = String(str).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function toProductionMonth(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), "iccu_defect_analysis_data.csv");
    const raw = fs.readFileSync(csvPath, "utf-8");
    const content = raw.replace(/^\uFEFF/, "");
    const lines = content.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      return NextResponse.json({ data: [] });
    }
    const headers = lines[0].split(",").map((h) => h.trim());
    const data: IccuRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const row: Record<string, string | number | boolean> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });
      const km = parseNum(String((row["주행거리(km)"] ?? "").toString().replace(/,/g, "")));
      const cost = parseNum(String((row["수리비용"] ?? "").toString().replace(/,/g, "")));
      const temp = parseNum(String(row["외기온도"] ?? ""));
      const failStr = String(row["고장발생여부"] ?? "").toUpperCase().trim();
      const 고장 = failStr === "Y";
      const 생산일자 = String(row["생산일자"] ?? "");
      data.push({
        차량ID: String(row["차량ID"] ?? ""),
        모델명: String(row["모델명"] ?? ""),
        생산일자,
        "주행거리(km)": km,
        고장발생여부: String(row["고장발생여부"] ?? ""),
        협력사: String(row["협력사"] ?? ""),
        "고장코드(DTC)": String(row["고장코드(DTC)"] ?? ""),
        수리비용: cost,
        외기온도: temp,
        고장,
        생산월: toProductionMonth(생산일자),
      });
    }

    return NextResponse.json({ data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load data", detail: String(e) },
      { status: 500 }
    );
  }
}
