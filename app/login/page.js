'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import { traducirError } from '@/lib/utils';

export default function Login() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const supabase = getSupabase();
      let correo = identificador.trim();

      // Si no parece un correo, se busca el correo asociado a ese nombre de usuario.
      if (!correo.includes('@')) {
        const { data, error: errUsuario } = await supabase.rpc('correo_por_usuario', {
          p_usuario: correo,
        });
        if (errUsuario) throw errUsuario;
        if (!data) {
          setError('Usuario o contraseña incorrectos.');
          setCargando(false);
          return;
        }
        correo = data;
      }

      const { error: errLogin } = await supabase.auth.signInWithPassword({
        email: correo,
        password: clave,
      });
      if (errLogin) throw errLogin;

      router.push('/panel');
    } catch (err) {
      setError(traducirError(err));
      setCargando(false);
    }
  }

  return (
    <div className="contenedor-angosto">
      <div className="tarjeta">
        <h1>Iniciar sesión</h1>
        <p className="subtitulo">Entra con tu correo o tu nombre de usuario.</p>

        {error && <div className="mensaje mensaje-error">{error}</div>}

        <form onSubmit={entrar}>
          <div className="campo">
            <label htmlFor="identificador">Correo o usuario</label>
            <input
              id="identificador"
              required
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input
              id="clave"
              type="password"
              required
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button className="boton boton-completo" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="pie-formulario">
          ¿Aún no tienes cuenta? <Link href="/registro">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
