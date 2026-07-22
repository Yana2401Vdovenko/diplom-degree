-- ============================================================
-- RLS-політики для ролей: admin, head, laborant, teacher.
-- Виконайте УВЕСЬ файл у Supabase Dashboard → SQL Editor.
-- Після виконання вийдіть із сайту та увійдіть знову,
-- щоб JWT отримав актуальну роль.
-- ============================================================

-- 1. Допоміжні функції
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$ SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') $$;

CREATE OR REPLACE FUNCTION public.has_app_role(allowed_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$ SELECT public.current_app_role() = any(allowed_roles) $$;

-- 2. RLS-політики на всіх таблицях
DO $$
DECLARE
  tbl_name text;
  managed_tables text[] := ARRAY[
    'Архів', 'Навантаження', 'Кафедральна_інформація', 'Завантаження_навантаження',
    'Дисципліни', 'Посада', 'Статус_викладача', 'Тип_викладача', 'Форма_навчання',
    'Рівень_навчання', 'Завантажені_документи', 'Кафедра', 'Викладач',
    'Факультет_ННІ', 'Абревіатура', 'ОПП', 'Спеціальність'
  ];
  -- Таблиці де пишуть admin, laborant, teacher (документи)
  documents_tables text[] := ARRAY['Завантажені_документи'];
  -- Таблиці де пишуть admin + laborant
  laborant_write_tables text[] := ARRAY[
    'Архів', 'Навантаження', 'Кафедральна_інформація', 'Завантаження_навантаження',
    'Дисципліни', 'Кафедра', 'Викладач'
  ];
BEGIN
  FOREACH tbl_name IN ARRAY managed_tables LOOP
    IF to_regclass(format('public.%I', tbl_name)) IS NOT NULL THEN
      -- Увімкнути RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl_name);
      -- Видалити старі політики якщо є
      EXECUTE format('DROP POLICY IF EXISTS app_read ON public.%I', tbl_name);
      EXECUTE format('DROP POLICY IF EXISTS app_write ON public.%I', tbl_name);

      IF tbl_name = ANY(documents_tables) THEN
        -- Документи: читають усі 4 ролі, пишуть admin + laborant + teacher
        EXECUTE format(
          'CREATE POLICY app_read ON public.%I FOR SELECT TO authenticated
           USING (public.has_app_role(ARRAY[''admin'',''head'',''laborant'',''teacher'']))',
          tbl_name
        );
        EXECUTE format(
          'CREATE POLICY app_write ON public.%I FOR ALL TO authenticated
           USING (public.has_app_role(ARRAY[''admin'',''laborant'',''teacher'']))
           WITH CHECK (public.has_app_role(ARRAY[''admin'',''laborant'',''teacher'']))',
          tbl_name
        );
      ELSIF tbl_name = 'Кафедральна_інформація' THEN
        -- Кафедральна інформація: читають усі 4, пишуть admin + laborant
        EXECUTE format(
          'CREATE POLICY app_read ON public.%I FOR SELECT TO authenticated
           USING (public.has_app_role(ARRAY[''admin'',''head'',''laborant'',''teacher'']))',
          tbl_name
        );
        EXECUTE format(
          'CREATE POLICY app_write ON public.%I FOR ALL TO authenticated
           USING (public.has_app_role(ARRAY[''admin'',''laborant'']))
           WITH CHECK (public.has_app_role(ARRAY[''admin'',''laborant'']))',
          tbl_name
        );
      ELSE
        -- Інші таблиці: читають admin + head + laborant
        EXECUTE format(
          'CREATE POLICY app_read ON public.%I FOR SELECT TO authenticated
           USING (public.has_app_role(ARRAY[''admin'',''head'',''laborant'']))',
          tbl_name
        );
        IF tbl_name = ANY(laborant_write_tables) THEN
          -- Кафедри, викладачі, навантаження: пишуть admin + laborant
          EXECUTE format(
            'CREATE POLICY app_write ON public.%I FOR ALL TO authenticated
             USING (public.has_app_role(ARRAY[''admin'',''laborant'']))
             WITH CHECK (public.has_app_role(ARRAY[''admin'',''laborant'']))',
            tbl_name
          );
        ELSE
          -- Довідники (Посада, Статус, Тип, Форма, Рівень): пише тільки admin
          EXECUTE format(
            'CREATE POLICY app_write ON public.%I FOR ALL TO authenticated
             USING (public.has_app_role(ARRAY[''admin'']))
             WITH CHECK (public.has_app_role(ARRAY[''admin'']))',
            tbl_name
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
