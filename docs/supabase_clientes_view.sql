-- Vista materializada de clientes para búsqueda rápida en g360-price-audit
-- (y utilizable desde g360-order-xlsx).
--
-- Ejecutar en Supabase Dashboard → SQL Editor.
-- La tabla `ventas` tiene una fila por venta; esta vista la colapsa a un
-- registro por cliente y agrega índices para búsqueda por texto (trgm).
--
-- Para refrescar los datos después: SELECT refresh_clientes();

create extension if not exists pg_trgm;

create materialized view if not exists clientes as
select distinct on (id_cliente)
  id_cliente,
  doc_cliente,
  nom_cliente,
  id_vendedor,
  nom_vendedor
from ventas
order by id_cliente;

create unique index if not exists clientes_id_cliente_idx
  on clientes (id_cliente);
create index if not exists clientes_nom_trgm_idx
  on clientes using gin (nom_cliente gin_trgm_ops);
create index if not exists clientes_doc_trgm_idx
  on clientes using gin (doc_cliente gin_trgm_ops);

-- Refrescar los datos de la vista (ejecutar cuando cambie el maestro de clientes)
create or replace function refresh_clientes()
returns void
language sql
security definer
as $$
  refresh materialized view clientes;
$$;

-- Lectura pública para el anon key
grant select on clientes to anon, authenticated;
