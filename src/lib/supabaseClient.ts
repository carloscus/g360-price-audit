import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Cliente Supabase para la búsqueda de clientes (tabla de ventas con el
 * maestro embebido, mismo esquema que g360-order-xlsx).
 * Retorna null si las variables de entorno no están configuradas; en ese
 * caso la UI degrada a captura manual de texto libre.
 */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  client = createClient(url, anonKey);
  return client;
};

/** true si hay Supabase configurado (habilita el modo búsqueda de 1 campo) */
export const isClientesHabilitado = (): boolean => getSupabaseClient() !== null;
