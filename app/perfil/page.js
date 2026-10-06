'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase';
import CamposPersonales from '@/components/CamposPersonales';
import { ESTADOS, NIVELES, traducirError } from '@/lib/utils';

export default function Perfil() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  function setDato(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
  }

  useEffect(() => {
    async function cargar() {
      try {
        const supabase = getSupabase();
        const { data: sesion } = await supabase.auth.getSession();
        if (!sesion.session) {
          router.replace('/login');
          return;
        }
        const { data, error: err } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', sesion.session.user.id)
          .maybeSingle();
        if (err) throw err;
        if (!data) {
          setError('No se encontró tu perfil.');
        } else {
          setPerfil(data);
          setDatos({
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            fecha_nacimiento: data.fecha_nacimiento || '',
            sexo: data.sexo || '',
            direccion: data.direccion || '',
            telefono: data.telefono || '',
            contacto_emergencia_nombre: data.contacto_emergencia_nombre || '',
            telefono_emergencia: data.telefono_emergencia || '',
          });
        }
      } catch (err) {
        setError(traducirError(err));
      }
      setCargando(false);
    }
    cargar();
  }, [router]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setExito('');
    setGuardando(true);
    try {
      const { error: err } = await getSupabase()
        .from('perfiles')
        .update({
          nombres: datos.nombres.trim(),
          apellidos: datos.apellidos.trim(),
          fecha_nacimiento: datos.fecha_nacimiento,
          sexo: datos.sexo,
          direccion: datos.direccion.trim(),
          telefono: datos.telefono.trim(),
          contacto_emergencia_nombre: datos.contacto_emergencia_nombre.trim() || null,
          telefono_emergencia: datos.telefono_emergencia.trim(),
        })
        .eq('id', perfil.id);
      if (err) throw err;
      setExito('Tus datos se guardaron correctamente.');
    } catch (err) {
      setError(traducirError(err));
    }
    setGuardando(false);
  }

  if (cargando) return <div className="cargando">Cargando…</div>;

  if (!perfil || !datos) {
    return (
      <div className="contenedor-angosto">
        <div className="mensaje mensaje-error">{error || 'No se pudo cargar tu perfil.'}</div>
      </div>
    );
  }

  return (
    <div className="contenedor-medio">
      <div className="tarjeta">
        <h1>Mi perfil</h1>
        <p className="subtitulo">Actualiza tus datos personales.</p>

        {error && <div className="mensaje mensaje-error">{error}</div>}
        {exito && <div className="mensaje mensaje-exito">{exito}</div>}

        <div className="rejilla">
          <div className="campo">
            <label>Correo</label>
            <input readOnly value={perfil.correo} />
          </div>
          <div className="campo">
            <label>Usuario</label>
            <input readOnly value={perfil.nombre_usuario} />
          </div>
          <div className="campo">
            <label>Nivel</label>
            <input readOnly value={NIVELES[perfil.nivel]} />
          </div>
          <div className="campo">
            <label>Estado de la cuenta</label>
            <input readOnly value={ESTADOS[perfil.estado]} />
          </div>
        </div>

        <hr className="separador" />

        <form onSubmit={guardar}>
          <CamposPersonales datos={datos} setDato={setDato} />
          <button className="boton" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
