'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function Inicio() {
  const router = useRouter();

  useEffect(() => {
    async function decidir() {
      try {
        const { data } = await getSupabase().auth.getSession();
        router.replace(data.session ? '/panel' : '/login');
      } catch (e) {
        router.replace('/login');
      }
    }
    decidir();
  }, [router]);

  return <div className="cargando">Cargando…</div>;
}
