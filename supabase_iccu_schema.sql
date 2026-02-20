-- ICCU 결함/품질 분석용 Supabase(PostgreSQL) DDL
-- 기본 타임존/로캘 설정은 Supabase 프로젝트 설정을 사용합니다.

-- 1. DTC 코드 마스터
create table if not exists public.dtc_codes (
  id bigint generated always as identity primary key,
  code text not null unique,            -- 예: P0A0F
  name text not null,                   -- 예: DC/DC 전압 이상
  description text,                     -- 상세 설명(선택)
  created_at timestamptz default now() not null
);

comment on table public.dtc_codes is 'ICCU 관련 고장 코드(DTC) 마스터';
comment on column public.dtc_codes.code is '진단 고장 코드 (OBD-II 등)';
comment on column public.dtc_codes.name is '코드 요약명';

-- 2. 차량/클레임(고장) 이벤트 테이블
create table if not exists public.iccu_defects (
  id bigint generated always as identity primary key,

  vehicle_id text not null,             -- 차량ID (예: EV-0001)
  model_name text not null,             -- 모델명 (예: 아이오닉 5, EV6)

  production_month date not null,       -- 생산월(YYYY-MM-01 형태로 저장)
  supplier_name text not null,          -- 협력사명 (예: A사, B사)

  mileage_km integer not null check (mileage_km >= 0),      -- 주행거리(km)
  ambient_temp_c integer,                                    -- 외기온도(섭씨)

  is_failure boolean not null default false,                 -- 고장 여부
  repair_cost_won bigint,                                    -- 수리 비용(원)

  dtc_code_id bigint references public.dtc_codes(id),        -- 주원인 DTC

  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

comment on table public.iccu_defects is 'ICCU 관련 차량별 고장/클레임 이벤트';
comment on column public.iccu_defects.production_month is '생산월(월 단위 분석용, YYYY-MM-01로 저장)';
comment on column public.iccu_defects.supplier_name is 'ICCU 모듈/부품 공급 협력사명';
comment on column public.iccu_defects.is_failure is '고장 여부 (Y/N 대신 boolean)';

create index if not exists iccu_defects_idx_prod_month
  on public.iccu_defects (production_month);

create index if not exists iccu_defects_idx_supplier_month
  on public.iccu_defects (supplier_name, production_month);

create index if not exists iccu_defects_idx_failure
  on public.iccu_defects (is_failure);

create index if not exists iccu_defects_idx_mileage
  on public.iccu_defects (mileage_km);

create index if not exists iccu_defects_idx_dtc
  on public.iccu_defects (dtc_code_id);

-- 3. 초기 DTC 코드 seed 데이터 (필요 시)
insert into public.dtc_codes (code, name)
values
  ('P0A0F', 'DC/DC 전압 이상'),
  ('P0AA6', '하이브리드 배터리 절연 저항'),
  ('P0D25', 'OBC 과열'),
  ('P1A34', '충전 제어 통신 오류'),
  ('U0293', 'ICCU 내부 통신 두절')
on conflict (code) do nothing;
