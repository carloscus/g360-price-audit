/**
 * Búsqueda de clientes contra Supabase, replicando el patrón de g360-order-xlsx
 * con dos fuentes detectadas en runtime:
 *
 * 1. Vista `clientes` (recomendada: ver docs/supabase_clientes_view.sql).
 *    Materializada + índice trgm → permite búsqueda "contiene" en milisegundos.
 * 2. Fallback tabla `ventas` (maestro embebido, una fila por venta):
 *    - Código (dígitos, ≤8): eq id_cliente con padStart (indexado, rápido)
 *    - RUC (11 dígitos): eq doc_cliente
 *    - Texto: una sola query or() con prefijo/palabra-inicial en nombre
 *      (escaneo costoso; la vista lo resuelve)
 *
 * Común: debounce 300ms, mínimo 2 caracteres, dedup por id_cliente,
 * abort con timeout y descarte de respuestas obsoletas.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';

export interface ClienteResultado {
  id_cliente: string;
  doc_cliente: string | null;
  nom_cliente: string | null;
  id_vendedor: string | null;
  nom_vendedor: string | null;
}

const CLIENTES_COLUMNS = 'id_cliente, doc_cliente, nom_cliente, id_vendedor, nom_vendedor';
const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;
const QUERY_TIMEOUT_MS = 8000;
const LIMITE = 10;

// Detección de fuente cacheada a nivel de módulo (una sola consulta extra por sesión)
let fuenteDetectada: 'clientes' | 'ventas' | null = null;

const detectarFuente = async (): Promise<'clientes' | 'ventas'> => {
  if (fuenteDetectada) return fuenteDetectada;
  const supabase = getSupabaseClient();
  if (!supabase) return 'ventas';
  const { error } = await supabase.from('clientes').select('id_cliente').limit(1);
  fuenteDetectada = error ? 'ventas' : 'clientes';
  return fuenteDetectada;
};

const dedupePorId = (rows: ClienteResultado[]): ClienteResultado[] => {
  const vistos = new Set<string>();
  return rows.filter(r => {
    if (vistos.has(r.id_cliente)) return false;
    vistos.add(r.id_cliente);
    return true;
  });
};

const esNumerico = (s: string) => /^\d+$/.test(s);

export const useClientes = () => {
  const [resultados, setResultados] = useState<ClienteResultado[]>([]);
  const [cargando, setCargando] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const seqRef = useRef(0);

  const habilitado = useMemo(() => getSupabaseClient() !== null, []);

  const limpiar = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    seqRef.current++;
    setResultados([]);
    setCargando(false);
  }, []);

  const buscar = useCallback((termino: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const term = termino.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    if (term.length < MIN_CHARS) {
      setResultados([]);
      setCargando(false);
      return;
    }
    setCargando(true);

    const seq = ++seqRef.current;
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = AbortSignal.timeout(QUERY_TIMEOUT_MS);
    signal.addEventListener('abort', () => controller.abort(), { once: true });

    timerRef.current = setTimeout(async () => {
      try {
        const fuente = await detectarFuente();
        if (seq !== seqRef.current) return;

        let data: ClienteResultado[] = [];

        if (fuente === 'clientes') {
          // Vista materializada con índice trgm: búsqueda "contiene" completa
          const r = await supabase.from('clientes')
            .select(CLIENTES_COLUMNS)
            .or(`nom_cliente.ilike.%${term}%,doc_cliente.ilike.%${term}%,id_cliente.ilike.%${term}%`)
            .limit(LIMITE)
            .abortSignal(controller.signal);
          if (r.error) throw r.error;
          data = (r.data ?? []) as ClienteResultado[];
        } else {
          // Fallback sobre ventas: rutas rápidas indexadas
          if (esNumerico(term)) {
            const codigo = term.padStart(8, '0');
            const r = await supabase.from('ventas')
              .select(CLIENTES_COLUMNS)
              .eq(term.length === 11 ? 'doc_cliente' : 'id_cliente', term.length === 11 ? term : codigo)
              .limit(LIMITE)
              .abortSignal(controller.signal);
            if (r.error) throw r.error;
            data = (r.data ?? []) as ClienteResultado[];
          } else {
            const r = await supabase.from('ventas')
              .select(CLIENTES_COLUMNS)
              .or(`nom_cliente.ilike.${term}%,nom_cliente.ilike.% ${term}%`)
              .limit(LIMITE)
              .abortSignal(controller.signal);
            if (r.error) throw r.error;
            data = (r.data ?? []) as ClienteResultado[];
          }
        }

        if (seq !== seqRef.current) return;
        setResultados(dedupePorId(data));
      } catch {
        if (seq === seqRef.current) {
          setResultados([]);
        }
      } finally {
        if (seq === seqRef.current) {
          setCargando(false);
        }
      }
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { resultados, cargando, habilitado, buscar, limpiar };
};
