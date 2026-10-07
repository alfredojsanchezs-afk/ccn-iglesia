'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import PersonaArbol from '@/components/PersonaArbol';
import Etapas from '@/components/Etapas';
import { NIVELES, calcularAtrasos, calcularEdad, nombreCompleto, traducirError } from '@/lib/utils';

export default function Panel() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [yo, setYo] = useState(null);
  const [perfiles, setPerfiles] = useState([]);
  const [cadena, setCadena] = useState([]);
  const [filas, setFilas] = useState([]);
  const [pestana, setPestana] = useState('red');
  const [trabajando, setTrabajando] = useState('');

  // Etapas de las personas que puedo ver (se usan en Etapas y para marcar atrasados en la Red).
  const cargarEtapas = useCallback(async () => {
    try {
      const { data, error: err } = await getSupabase().from('etapas_progreso').select('*');
      if (err) throw err;
      setFilas(data || []);
    } catch (err) {
      setError(traducirError(err));
    }
  }, []);

  const cargar = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: sesion } = await supabase.auth.getSession();
      if (!sesion.session) {
        router.replace('/login');
        return;
      }

      const uid = sesion.session.user.id;
      const { data: miPerfil, error: errPerfil } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (errPerfil) throw errPerfil;
      if (!miPerfil) {
        setError('No se encontró tu perfil. Contacta a un pastor.');
        setCargando(false);
        return;
      }
      setYo(miPerfil);

      if (miPerfil.estado === 'aprobado') {
        const { data: lista, error: errLista } = await supabase.from('perfiles').select('*');
        if (errLista) throw errLista;
        setPerfiles(lista || []);
        await cargarEtapas();

        if (miPerfil.nivel !== 'pastor') {
          const { data: sup } = await supabase.rpc('mi_cadena');
          setCadena(sup || []);
        }
      }
      setCargando(false);
    } catch (err) {
      setError(traducirError(err));
      setCargando(false);
    }
  }, [router, cargarEtapas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function cambiarEstado(id, estado) {
    setTrabajando(id);
    setError('');
    try {
      const { error: err } = await getSupabase().from('perfiles').update({ estado }).eq('id', id);
      if (err) throw err;
      await cargar();
    } catch (err) {
      setError(traducirError(err));
    }
    setTrabajando('');
  }

  if (cargando) return <div className="cargando">Cargando…</div>;

  if (!yo) {
    return (
      <div className="contenedor-angosto">
        <div className="mensaje mensaje-error">{error || 'No se pudo cargar tu información.'}</div>
        <Link href="/login">Volver a iniciar sesión</Link>
      </div>
    );
  }

  if (yo.estado === 'pendiente') {
    return (
      <div className="contenedor-medio">
        <div className="tarjeta">
          <h1>Hola, {yo.nombres}</h1>
          <div className="mensaje mensaje-info">
            Tu cuenta está <strong>pendiente de aprobación</strong>. Un Pastor debe aprobarla antes de
            que puedas ver el panel. Vuelve a entrar más tarde.
          </div>
          <Link className="boton boton-azul" href="/perfil">
            Ver mi perfil
          </Link>
        </div>
      </div>
    );
  }

  if (yo.estado === 'rechazado') {
    return (
      <div className="contenedor-medio">
        <div className="tarjeta">
          <h1>Hola, {yo.nombres}</h1>
          <div className="mensaje mensaje-error">
            Tu solicitud no fue aprobada. Si crees que es un error, comunícate con un Pastor.
          </div>
        </div>
      </div>
    );
  }

  const esPastor = yo.nivel === 'pastor';
  const aprobados = perfiles.filter((p) => p.estado === 'aprobado');
  const solicitudes = perfiles.filter((p) => p.estado !== 'aprobado');
  const pendientes = solicitudes.filter((p) => p.estado === 'pendiente');
  const miRed = aprobados.filter((p) => p.id !== yo.id);

  const etiquetaRed = {
    pastor: 'Red de la iglesia',
    pastor_base: 'Mis líderes y discípulos',
    lider: 'Mis discípulos',
    discipulo: 'Mi cobertura',
  }[yo.nivel];

  // Pestañas del panel según el nivel.
  const pestanasDisponibles = esPastor
    ? ['red', 'etapas', 'solicitudes']
    : yo.nivel === 'discipulo'
    ? ['etapas']
    : ['red', 'etapas'];
  const pestanaActiva = pestanasDisponibles.includes(pestana) ? pestana : pestanasDisponibles[0];
  const etiquetasPestana = {
    red: esPastor ? 'Red de la iglesia' : etiquetaRed,
    etapas: yo.nivel === 'discipulo' ? 'Mis etapas' : 'Etapas',
    solicitudes: 'Solicitudes',
  };

  return (
    <div className="contenedor">
      <div className="tarjeta">
        <h1>
          Bienvenido, {yo.nombres}{' '}
          <span className={`insignia insignia-${yo.nivel}`}>{NIVELES[yo.nivel]}</span>
        </h1>
        <p className="subtitulo" style={{ marginBottom: 0 }}>
          {calcularEdad(yo.fecha_nacimiento) !== null && `${calcularEdad(yo.fecha_nacimiento)} años · `}
          {yo.correo}
        </p>
      </div>

      {error && <div className="mensaje mensaje-error">{error}</div>}

      {!esPastor && (
        <div className="tarjeta">
          <h2>Mi cobertura</h2>
          {cadena.length === 0 ? (
            <p className="vacio">Sin superiores asignados.</p>
          ) : (
            <div className="cadena">
              <div className="cadena-paso">
                <small>Yo — {NIVELES[yo.nivel]}</small>
                {nombreCompleto(yo)}
              </div>
              {cadena.map((c) => (
                <span key={c.id} style={{ display: 'contents' }}>
                  <span className="cadena-flecha">→</span>
                  <div className="cadena-paso">
                    <small>{NIVELES[c.nivel]}</small>
                    {c.nombres} {c.apellidos}
                  </div>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="pestanas">
        {pestanasDisponibles.map((clave) => (
          <button
            key={clave}
            type="button"
            className={`pestana ${pestanaActiva === clave ? 'pestana-activa' : ''}`}
            onClick={() => setPestana(clave)}
          >
            {etiquetasPestana[clave]}
            {clave === 'solicitudes' && pendientes.length > 0 && (
              <span className="pastilla-contador">{pendientes.length}</span>
            )}
          </button>
        ))}
      </div>

      {pestanaActiva === 'etapas' && (
        <Etapas yo={yo} perfiles={aprobados} filas={filas} onCambio={cargarEtapas} />
      )}

      {pestanaActiva === 'red' && (
        <div className="tarjeta">
          <h2>{etiquetaRed}</h2>
          {miRed.length === 0 && !esPastor ? (
            <p className="vacio">
              {yo.nivel === 'pastor_base'
                ? 'Aún no tienes líderes registrados contigo.'
                : 'Aún no tienes discípulos registrados contigo.'}
            </p>
          ) : (
            <PersonaArbol perfiles={aprobados} atrasos={calcularAtrasos(filas)} />
          )}
        </div>
      )}

      {pestanaActiva === 'solicitudes' && (
        <div className="tarjeta">
          <h2>Solicitudes de registro</h2>
          {solicitudes.length === 0 ? (
            <p className="vacio">No hay solicitudes pendientes.</p>
          ) : (
            solicitudes
              .sort((a, b) => (a.creado_en < b.creado_en ? 1 : -1))
              .map((p) => (
                <div className="fila-solicitud" key={p.id}>
                  <div>
                    <strong>{nombreCompleto(p)}</strong>{' '}
                    <span className={`insignia insignia-${p.nivel}`}>{NIVELES[p.nivel]}</span>{' '}
                    <span className={`insignia insignia-${p.estado}`}>
                      {p.estado === 'pendiente' ? 'Pendiente' : 'Rechazado'}
                    </span>
                    <div style={{ fontSize: '0.88rem', color: 'var(--gris-texto)' }}>
                      {p.correo} · {p.telefono}
                    </div>
                  </div>
                  <div className="acciones">
                    <button
                      type="button"
                      className="boton boton-chico"
                      disabled={trabajando === p.id}
                      onClick={() => cambiarEstado(p.id, 'aprobado')}
                    >
                      Aprobar
                    </button>
                    {p.estado === 'pendiente' && (
                      <button
                        type="button"
                        className="boton boton-chico boton-borde"
                        disabled={trabajando === p.id}
                        onClick={() => cambiarEstado(p.id, 'rechazado')}
                      >
                        Rechazar
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </div>
  );
}
