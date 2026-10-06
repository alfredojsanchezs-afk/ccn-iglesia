'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';

export default function Header() {
  const router = useRouter();
  const [haySesion, setHaySesion] = useState(false);
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    let suscripcion;
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data }) => setHaySesion(!!data.session));
      const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
        setHaySesion(!!sesion);
      });
      suscripcion = data.subscription;
    } catch (e) {
      // Sin variables de entorno: se muestra el encabezado sin sesión.
    }
    return () => suscripcion && suscripcion.unsubscribe();
  }, []);

  async function salir() {
    try {
      await getSupabase().auth.signOut();
    } catch (e) {
      // ignorar
    }
    router.push('/login');
  }

  return (
    <header className="encabezado">
      <div className="encabezado-interior">
        <Link href="/" className="marca">
          {logoOk && (
            // La imagen se coloca en public/logo/logo.png
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo/logo.png" alt="Logo CCN" onError={() => setLogoOk(false)} />
          )}
          <span className="marca-texto">
            <strong>Centro Cristiano para las Naciones</strong>
            <span>CCN</span>
          </span>
        </Link>

        <nav className="navegacion">
          {haySesion ? (
            <>
              <Link href="/panel">Panel</Link>
              <Link href="/perfil">Mi perfil</Link>
              <button type="button" onClick={salir}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Iniciar sesión</Link>
              <Link href="/registro">Registrarme</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
