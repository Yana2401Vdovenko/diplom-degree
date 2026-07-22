DROP FUNCTION IF EXISTS get_all_tables();
DROP FUNCTION IF EXISTS get_table_columns(text);
DROP FUNCTION IF EXISTS get_table_constraints(text);
DROP FUNCTION IF EXISTS get_table_indexes(text);

CREATE OR REPLACE FUNCTION get_all_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

CREATE OR REPLACE FUNCTION get_table_columns(target_table text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text,
  character_maximum_length bigint,
  udt_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default,
    c.character_maximum_length,
    c.udt_name::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = target_table
  ORDER BY c.ordinal_position;
$$;

CREATE OR REPLACE FUNCTION get_table_constraints(target_table text)
RETURNS TABLE(
  constraint_name text,
  constraint_type text,
  column_name text,
  foreign_table_name text,
  foreign_column_name text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    tc.constraint_name::text,
    tc.constraint_type::text,
    kcu.column_name::text,
    ccu.table_name::text AS foreign_table_name,
    ccu.column_name::text AS foreign_column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  LEFT JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = target_table
  ORDER BY tc.constraint_name;
$$;

CREATE OR REPLACE FUNCTION get_table_indexes(target_table text)
RETURNS TABLE(
  index_name text,
  column_names text,
  is_unique boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    i.relname::text AS index_name,
    array_agg(a.attname ORDER BY k.n) AS column_names,
    ix.indisunique AS is_unique
  FROM pg_class t
  JOIN pg_index ix ON t.oid = ix.indrelid
  JOIN pg_class i ON i.oid = ix.indexrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  CROSS JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n)
  JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
  WHERE n.nspname = 'public'
    AND t.relname = target_table
    AND t.relkind = 'r'
  GROUP BY i.relname, ix.indisunique
  ORDER BY i.relname;
$$;
