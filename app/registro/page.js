'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import CamposPersonales from '@/components/CamposPersonales';
import { NIVELES, NIVEL_SUPERIOR, traducirError } from '@/lib/utils';

const INICIAL = {
  correo: '',
  nombre_usuario: '',
  clave: '',
  clave2: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  sexo: '',
  direccion: '',
  telefono: '',
  contacto_emergencia_nombre: '',
  telefono_emergencia: '',
  nivel: '',
  superior_id: '',
};

export default function Registro() {
  const router = useRouter();
  const [datos, setDatos] = useState(INICIAL);
  const [superiores, setSuperiores] = useState([]);
  const [cargandoSup, setCargandoSup] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [enviando, setEnviando] = useState(false);

  function setDato(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  // Cada vez que cambia el nivel, se carga la lista de superiores posibles.
  useEffect(() => {
    setSuperiores([]);
    setDato('superior_id', '');
    const nivelSup = NIVEL_SUPERIOR[datos.nivel];
    if (!nivelSup) return;

    let cancelado = false;
    setCargandoSup(true);
    getSupabase()
      .rpc('listar_superiores', { p_nivel: nivelSup })
      .then(({ data, error: err }) => {
        if (cancelado) return;
        if (err) setError(traducirError(err));
        else setSuperiores(data || []);
        setCargandoSup(false);
      })
      .catch((err) => {
        if (cancelado) return;
        setError(traducirError(err));
        setCargandoSup(false);
      });
    return () => {
      cancelado = true;
    };
  }, [datos.nivel]);

  const superiorElegido = superiores.find((s) => s.id === datos.superior_id);
  const nivelSup = NIVEL_SUPERIOR[datos.nivel];

  async function registrar(e) {
    e.preventDefault();
    setError('');

    const usuario = datos.nombre_usuario.trim();
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(usuario)) {
      setError('El nombre de usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo (sin espacios ni @).');
      return;
    }
    if (datos.clave.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (datos.clave !== datos.clave2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (!datos.nivel) {
      setError('Selecciona tu nivel.');
      return;
    }
    if (nivelSup && !datos.superior_id) {
      setError(`Selecciona tu ${NIVELES[nivelSup].toLowerCase()}.`);
      return;
    }

    setEnviando(true);
    try {
      const supabase = getSupabase();

      const { data: libre, error: errLibre } = await supabase.rpc('usuario_disponible', {
        p_usuario: usuario,
      });
      if (errLibre) throw errLibre;
      if (!libre) {
        setError('Ese nombre de usuario ya está en uso. Elige otro.');
        setEnviando(false);
        return;
      }

      const { data, error: errRegistro } = await supabase.auth.signUp({
        email: datos.correo.trim(),
        password: datos.clave,
        options: {
          data: {
            nombre_usuario: usuario,
            nombres: datos.nombres.trim(),
            apellidos: datos.apellidos.trim(),
            fecha_nacimiento: datos.fecha_nacimiento,
            sexo: datos.sexo,
            direccion: datos.direccion.trim(),
            telefono: datos.telefono.trim(),
            contacto_emergencia_nombre: datos.contacto_emergencia_nombre.trim(),
            telefono_emergencia: datos.telefono_emergencia.trim(),
            nivel: datos.nivel,
            superior_id: datos.superior_id || '',
          },
        },
      });
      if (errRegistro) throw errRegistro;

      if (data.session) {
        router.push('/panel');
      } else {
        setAviso('¡Cuenta creada! Revisa tu correo para confirmarla y luego inicia sesión.');
        setEnviando(false);
      }
    } catch (err) {
      setError(traducirError(err));
      setEnviando(false);
    }
  }

  if (aviso) {
    return (
      <div className="contenedor-angosto">
        <div className="tarjeta">
          <h1>Registro completado</h1>
          <div className="mensaje mensaje-exito">{aviso}</div>
          <Link className="boton boton-completo" href="/login">
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor-medio">
      <div className="tarjeta">
        <h1>Crear cuenta</h1>
        <p className="subtitulo">Completa tus datos para registrarte en la plataforma de CCN.</p>

        {error && <div className="mensaje mensaje-error">{error}</div>}

        <form onSubmit={registrar}>
          <h2>Acceso</h2>
          <div className="rejilla">
            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                required
                value={datos.correo}
                onChange={(e) => setDato('correo', e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="campo">
              <label htmlFor="nombre_usuario">Nombre de usuario</label>
              <input
                id="nombre_usuario"
                required
                value={datos.nombre_usuario}
                onChange={(e) => setDato('nombre_usuario', e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>
          <div className="rejilla">
            <div className="campo">
              <label htmlFor="clave">Contraseña</label>
              <input
                id="clave"
                type="password"
                required
                minLength={6}
                value={datos.clave}
                onChange={(e) => setDato('clave', e.target.value)}
                autoComplete="new-password"
              />
              <span className="ayuda">Mínimo 6 caracteres.</span>
            </div>
            <div className="campo">
              <label htmlFor="clave2">Repetir contraseña</label>
              <input
                id="clave2"
                type="password"
                required
                value={datos.clave2}
                onChange={(e) => setDato('clave2', e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <hr className="separador" />
          <h2>Datos personales</h2>
          <CamposPersonales datos={datos} setDato={setDato} />

          <hr className="separador" />
          <h2>Nivel en la iglesia</h2>
          <div className="campo">
            <label htmlFor="nivel">¿Cuál es tu nivel?</label>
            <select
              id="nivel"
              required
              value={datos.nivel}
              onChange={(e) => setDato('nivel', e.target.value)}
            >
              <option value="">Selecciona…</option>
              {Object.entries(NIVELES).map(([clave, nombre]) => (
                <option key={clave} value={clave}>
                  {nombre}
                </option>
              ))}
            </select>
            {datos.nivel && (
              <span className="ayuda">
                Todas las cuentas deben ser aprobadas por un Pastor antes de poder entrar al panel.
              </span>
            )}
          </div>

          {nivelSup && (
            <div className="campo">
              <label htmlFor="superior">
                {datos.nivel === 'pastor_base' && 'Pastor al que perteneces'}
                {datos.nivel === 'lider' && 'Pastor base al que perteneces'}
                {datos.nivel === 'discipulo' && 'Tu líder'}
              </label>
              <select
                id="superior"
                required
                value={datos.superior_id}
                onChange={(e) => setDato('superior_id', e.target.value)}
                disabled={cargandoSup}
              >
                <option value="">
                  {cargandoSup ? 'Cargando…' : 'Selecciona…'}
                </option>
                {superiores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
              {!cargandoSup && superiores.length === 0 && (
                <span className="ayuda">
                  Todavía no hay {NIVELES[nivelSup].toLowerCase()}s aprobados disponibles.
                </span>
              )}
              {superiorElegido && datos.nivel === 'discipulo' && (
                <div className="desglose">
                  <strong>Tu cobertura:</strong> Líder {superiorElegido.nombre} → Pastor base{' '}
                  {superiorElegido.pastor_base} → Pastor {superiorElegido.pastor}
                </div>
              )}
              {superiorElegido && datos.nivel === 'lider' && (
                <div className="desglose">
                  <strong>Tu cobertura:</strong> Pastor base {superiorElegido.nombre} → Pastor{' '}
                  {superiorElegido.pastor}
                </div>
              )}
            </div>
          )}

          <button className="boton boton-completo" disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="pie-formulario">
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
