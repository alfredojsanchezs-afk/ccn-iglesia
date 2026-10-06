'use client';

import { NIVELES, calcularEdad, formatearFecha, nombreCompleto } from '@/lib/utils';

function Detalle({ p }) {
  const edad = calcularEdad(p.fecha_nacimiento);
  return (
    <dl className="persona-detalle">
      <div>
        <dt>Correo</dt>
        <dd>{p.correo}</dd>
      </div>
      <div>
        <dt>Usuario</dt>
        <dd>{p.nombre_usuario}</dd>
      </div>
      <div>
        <dt>Fecha de nacimiento</dt>
        <dd>
          {formatearFecha(p.fecha_nacimiento)}
          {edad !== null && ` (${edad} años)`}
        </dd>
      </div>
      <div>
        <dt>Sexo</dt>
        <dd style={{ textTransform: 'capitalize' }}>{p.sexo}</dd>
      </div>
      <div>
        <dt>Dirección</dt>
        <dd>{p.direccion}</dd>
      </div>
      <div>
        <dt>Teléfono</dt>
        <dd>{p.telefono}</dd>
      </div>
      <div>
        <dt>Contacto de emergencia</dt>
        <dd>
          {p.contacto_emergencia_nombre ? `${p.contacto_emergencia_nombre} — ` : ''}
          {p.telefono_emergencia}
        </dd>
      </div>
    </dl>
  );
}

// Una persona y, debajo, todas las personas que dependen de ella.
export function NodoPersona({ persona, hijosPorSuperior }) {
  const hijos = hijosPorSuperior[persona.id] || [];
  return (
    <li>
      <details className="persona">
        <summary>
          <strong>{nombreCompleto(persona)}</strong>
          <span className={`insignia insignia-${persona.nivel}`}>{NIVELES[persona.nivel]}</span>
          {hijos.length > 0 && (
            <small style={{ color: 'var(--gris-texto)' }}>
              {hijos.length} directo{hijos.length === 1 ? '' : 's'}
            </small>
          )}
        </summary>
        <Detalle p={persona} />
      </details>
      {hijos.length > 0 && (
        <ul>
          {hijos.map((h) => (
            <NodoPersona key={h.id} persona={h} hijosPorSuperior={hijosPorSuperior} />
          ))}
        </ul>
      )}
    </li>
  );
}

// Arma el árbol a partir de una lista plana de perfiles aprobados.
export default function PersonaArbol({ perfiles }) {
  const ids = new Set(perfiles.map((p) => p.id));
  const hijosPorSuperior = {};
  const raices = [];

  perfiles.forEach((p) => {
    if (p.superior_id && ids.has(p.superior_id)) {
      (hijosPorSuperior[p.superior_id] = hijosPorSuperior[p.superior_id] || []).push(p);
    } else {
      raices.push(p);
    }
  });

  const ordenar = (a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es');
  raices.sort(ordenar);
  Object.values(hijosPorSuperior).forEach((lista) => lista.sort(ordenar));

  if (raices.length === 0) {
    return <p className="vacio">Todavía no hay personas en tu red.</p>;
  }

  return (
    <ul className="arbol">
      {raices.map((r) => (
        <NodoPersona key={r.id} persona={r} hijosPorSuperior={hijosPorSuperior} />
      ))}
    </ul>
  );
}
