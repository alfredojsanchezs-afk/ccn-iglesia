'use client';

import { calcularEdad } from '@/lib/utils';

// Campos personales compartidos entre el registro y la edición del perfil.
export default function CamposPersonales({ datos, setDato }) {
  const edad = calcularEdad(datos.fecha_nacimiento);
  const hoy = new Date().toISOString().slice(0, 10);

  return (
    <>
      <div className="rejilla">
        <div className="campo">
          <label htmlFor="nombres">Nombres</label>
          <input
            id="nombres"
            required
            value={datos.nombres}
            onChange={(e) => setDato('nombres', e.target.value)}
            autoComplete="given-name"
          />
        </div>
        <div className="campo">
          <label htmlFor="apellidos">Apellidos</label>
          <input
            id="apellidos"
            required
            value={datos.apellidos}
            onChange={(e) => setDato('apellidos', e.target.value)}
            autoComplete="family-name"
          />
        </div>
      </div>

      <div className="rejilla">
        <div className="campo">
          <label htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input
            id="fecha_nacimiento"
            type="date"
            required
            max={hoy}
            value={datos.fecha_nacimiento}
            onChange={(e) => setDato('fecha_nacimiento', e.target.value)}
          />
        </div>
        <div className="campo">
          <label htmlFor="edad">Edad</label>
          <input
            id="edad"
            readOnly
            value={edad === null ? '' : `${edad} años`}
            placeholder="Aqui aparece tu edad"
          />
        </div>
      </div>

      <div className="campo">
        <label htmlFor="sexo">Sexo</label>
        <select
          id="sexo"
          required
          value={datos.sexo}
          onChange={(e) => setDato('sexo', e.target.value)}
        >
          <option value="">Selecciona…</option>
          <option value="masculino">Masculino</option>
          <option value="femenino">Femenino</option>
        </select>
      </div>

      <div className="campo">
        <label htmlFor="direccion">Dirección</label>
        <input
          id="direccion"
          required
          value={datos.direccion}
          onChange={(e) => setDato('direccion', e.target.value)}
          autoComplete="street-address"
        />
      </div>

      <div className="campo">
        <label htmlFor="telefono">Teléfono personal</label>
        <input
          id="telefono"
          type="tel"
          required
          value={datos.telefono}
          onChange={(e) => setDato('telefono', e.target.value)}
          autoComplete="tel"
        />
      </div>

      <div className="rejilla">
        <div className="campo">
          <label htmlFor="contacto_emergencia_nombre">Contacto de emergencia (nombre)</label>
          <input
            id="contacto_emergencia_nombre"
            value={datos.contacto_emergencia_nombre}
            onChange={(e) => setDato('contacto_emergencia_nombre', e.target.value)}
            placeholder="Opcional"
          />
        </div>
        <div className="campo">
          <label htmlFor="telefono_emergencia">Teléfono de emergencia</label>
          <input
            id="telefono_emergencia"
            type="tel"
            required
            value={datos.telefono_emergencia}
            onChange={(e) => setDato('telefono_emergencia', e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
