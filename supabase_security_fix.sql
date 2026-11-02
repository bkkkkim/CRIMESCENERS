-- ============================================================================
-- CRIME SCENERS - Supabase 개인정보 보호(RLS) 및 보안 함수 일괄 적용 스크립트
-- 실행 위치: Supabase Dashboard -> SQL Editor -> New query 붙여넣기 -> Run 클릭
-- ============================================================================

-- 1. 관리자 비밀번호 전용 비공개 보안 테이블 생성 (외부에서 절대 조회 불가)
CREATE TABLE IF NOT EXISTS public.admin_secrets (
  key text PRIMARY KEY,
  value text NOT NULL
);

ALTER TABLE public.admin_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_secrets FROM anon, authenticated;

-- 기존 관리자 비밀번호('0226') 초기 등록 (이미 있으면 유지됨)
-- 비밀번호를 바꾸고 싶으시면 아래 '0226' 대신 원하는 비밀번호로 수정 후 실행하세요.
INSERT INTO public.admin_secrets (key, value)
VALUES ('admin_password', '0226')
ON CONFLICT (key) DO NOTHING;

-- 2. 기존에 열려 있던 모든 공개 권한(Policy) 초기화
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('reservations', 'inquiries', 'site_contents', 'admin_secrets')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 3. 테이블별 행 수준 보안(RLS) 활성화 및 최소 권한만 허용
-- (1) 예약 테이블: 외부 조회(SELECT)/수정/삭제 전면 차단, 신규 예약 접수(INSERT)만 허용
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.reservations') IS NOT NULL THEN
    CREATE POLICY "allow_public_insert_reservations"
      ON public.reservations
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- (2) 문의하기 테이블: 외부 조회(SELECT)/수정/삭제 전면 차단, 신규 문의 접수(INSERT)만 허용
ALTER TABLE IF EXISTS public.inquiries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.inquiries') IS NOT NULL THEN
    CREATE POLICY "allow_public_insert_inquiries"
      ON public.inquiries
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- (3) 사이트 설정/테마 테이블: 홈페이지 방문자 읽기(SELECT)만 허용, 임의 수정 차단
ALTER TABLE IF EXISTS public.site_contents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.site_contents') IS NOT NULL THEN
    CREATE POLICY "allow_public_read_site_contents"
      ON public.site_contents
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- ============================================================================
-- 4. 일반 방문자용 안전 함수 (개인정보 0% — 날짜/시간/인원수만 반환)
-- ============================================================================

-- (1) 전체 예약 마감 현황용: 이름/연락처/예약번호/메모 없이 슬롯 인원수만 반환
CREATE OR REPLACE FUNCTION public.get_public_slot_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'themeId', to_jsonb(r)->>'themeId',
        'date', to_jsonb(r)->>'date',
        'time', to_jsonb(r)->>'time',
        'participantCount', COALESCE((to_jsonb(r)->>'participantCount')::int, 0),
        'isCloseRequested', COALESCE((to_jsonb(r)->>'isCloseRequested')::boolean, false),
        'status', COALESCE(to_jsonb(r)->>'status', 'confirmed')
      )
    ),
    '[]'::jsonb
  )
  INTO result
  FROM public.reservations r
  WHERE LOWER(COALESCE(to_jsonb(r)->>'status', 'confirmed')) NOT IN ('cancelled', 'canceled');

  RETURN result;
END;
$$;

-- (2) 예약 신청 화면(특정 타임 오픈 예약)용: 이름/연락처/예약번호 없이 참여인원 및 오픈메모만 반환
CREATE OR REPLACE FUNCTION public.get_public_slot_details(
  p_theme_id text,
  p_date text,
  p_time text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'themeId', to_jsonb(r)->>'themeId',
        'date', to_jsonb(r)->>'date',
        'time', to_jsonb(r)->>'time',
        'participantCount', COALESCE((to_jsonb(r)->>'participantCount')::int, 0),
        'isCloseRequested', COALESCE((to_jsonb(r)->>'isCloseRequested')::boolean, false),
        'status', COALESCE(to_jsonb(r)->>'status', 'confirmed'),
        'notes', CASE
          WHEN COALESCE((to_jsonb(r)->>'isCloseRequested')::boolean, false) THEN ''
          ELSE COALESCE(to_jsonb(r)->>'notes', '')
        END
      )
    ),
    '[]'::jsonb
  )
  INTO result
  FROM public.reservations r
  WHERE TRIM(COALESCE(to_jsonb(r)->>'themeId', '')) = TRIM(COALESCE(p_theme_id, ''))
    AND REPLACE(REPLACE(TRIM(COALESCE(to_jsonb(r)->>'date', '')), '.', '-'), '/', '-') = REPLACE(REPLACE(TRIM(COALESCE(p_date, '')), '.', '-'), '/', '-')
    AND TRIM(COALESCE(to_jsonb(r)->>'time', '')) = TRIM(COALESCE(p_time, ''))
    AND LOWER(COALESCE(to_jsonb(r)->>'status', 'confirmed')) NOT IN ('cancelled', 'canceled');

  RETURN result;
END;
$$;

-- (3) 고객 본인 예약확인용: 예약번호 + 성함 + 연락처 3가지가 모두 일치할 때만 해당 1건 반환
CREATE OR REPLACE FUNCTION public.lookup_reservation(
  p_booking_number text,
  p_user_name text,
  p_user_phone text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_code text := UPPER(REGEXP_REPLACE(TRIM(COALESCE(p_booking_number, '')), '^#', ''));
  clean_name text := TRIM(COALESCE(p_user_name, ''));
  clean_phone text := REGEXP_REPLACE(COALESCE(p_user_phone, ''), '[^0-9]', '', 'g');
  matched jsonb;
BEGIN
  IF LENGTH(clean_code) < 4 OR clean_name = '' OR LENGTH(clean_phone) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(r)
  INTO matched
  FROM public.reservations r
  WHERE LOWER(COALESCE(to_jsonb(r)->>'status', 'confirmed')) NOT IN ('cancelled', 'canceled')
    AND TRIM(COALESCE(to_jsonb(r)->>'userName', '')) = clean_name
    AND REGEXP_REPLACE(COALESCE(to_jsonb(r)->>'userPhone', ''), '[^0-9]', '', 'g') = clean_phone
    AND (
      UPPER(COALESCE(to_jsonb(r)->>'bookingNumber', '')) = clean_code
      OR UPPER(SPLIT_PART(COALESCE(to_jsonb(r)->>'id', ''), '-', 1)) = clean_code
      OR UPPER(COALESCE(to_jsonb(r)->>'id', '')) = clean_code
    )
  ORDER BY COALESCE(to_jsonb(r)->>'createdAt', '') DESC
  LIMIT 1;

  RETURN matched;
END;
$$;

-- (4) 고객 본인 예약취소용: 예약ID + 성함 + 연락처가 모두 일치할 때만 취소 처리
CREATE OR REPLACE FUNCTION public.cancel_user_reservation(
  p_id text,
  p_user_name text,
  p_user_phone text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_name text := TRIM(COALESCE(p_user_name, ''));
  clean_phone text := REGEXP_REPLACE(COALESCE(p_user_phone, ''), '[^0-9]', '', 'g');
  updated_rows int;
BEGIN
  IF COALESCE(TRIM(p_id), '') = '' OR clean_name = '' OR LENGTH(clean_phone) < 8 THEN
    RETURN false;
  END IF;

  UPDATE public.reservations r
  SET status = 'cancelled'
  WHERE r.id::text = TRIM(p_id)
    AND TRIM(COALESCE(to_jsonb(r)->>'userName', '')) = clean_name
    AND REGEXP_REPLACE(COALESCE(to_jsonb(r)->>'userPhone', ''), '[^0-9]', '', 'g') = clean_phone;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

-- ============================================================================
-- 5. 관리자 페이지(/admin) 전용 보안 함수 (비밀번호 서버 검증 필수)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_admin_password(p_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pw text;
BEGIN
  SELECT value INTO stored_pw
  FROM public.admin_secrets
  WHERE key = 'admin_password';

  RETURN stored_pw IS NOT NULL AND p_password = stored_pw;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_reservations(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized admin access';
  END IF;

  SELECT COALESCE(
    jsonb_agg(to_jsonb(r) ORDER BY COALESCE(to_jsonb(r)->>'createdAt', '') DESC),
    '[]'::jsonb
  )
  INTO result
  FROM public.reservations r;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_reservation_status(
  p_password text,
  p_id text,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_rows int;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized admin access';
  END IF;

  UPDATE public.reservations r
  SET status = p_status
  WHERE r.id::text = TRIM(p_id);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_inquiries(p_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized admin access';
  END IF;

  IF to_regclass('public.inquiries') IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  EXECUTE $q$
    SELECT COALESCE(
      jsonb_agg(to_jsonb(i) ORDER BY COALESCE(to_jsonb(i)->>'createdAt', '') DESC),
      '[]'::jsonb
    )
    FROM public.inquiries i
  $q$ INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_save_site_content(
  p_password text,
  p_key text,
  p_value jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.verify_admin_password(p_password) THEN
    RAISE EXCEPTION 'Unauthorized admin access';
  END IF;

  INSERT INTO public.site_contents (key, value)
  VALUES (p_key, p_value)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  RETURN true;
END;
$$;

-- 6. 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.get_public_slot_bookings() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_slot_details(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_reservation(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_user_reservation(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_password(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_reservations(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_reservation_status(text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_inquiries(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_site_content(text, text, jsonb) TO anon, authenticated;
