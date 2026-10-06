import { createClient } from '@supabase/supabase-js';

let cliente = null;

// Cliente único de Supabase (se crea la primera vez que se necesita).
export function getSupabase() {
  if (!cliente) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !clave) {
      throw new Error('Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    cliente = createClient(url, clave);
  }
  return cliente;
}
