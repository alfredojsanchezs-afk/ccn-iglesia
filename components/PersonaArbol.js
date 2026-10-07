'use client';

import { useState } from 'react';
import { FASES, NIVELES, calcularEdad, formatearFecha, nombreCompleto } from '@/lib/utils';
import './etapas.css';

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
// Cuenta todas las personas debajo de `id` y cuántas de ellas están atrasadas.
function contarDescendientes(id, hijosPorSuperior, atrasos) {
  let total = 0;
  let atrasados = 0;
  (hijosPorSuperior[id] || []).forEach((h) => {
    total += 1;
    if ((atrasos[h.id] || []).length > 0) atrasados += 1;
    const sub = contarDescendientes(h.id, hijosPorSuperior, atrasos);
    total += sub.total;
    atrasados += sub.atrasados;
  });
  return { total, atrasados };
}

export function NodoPersona({ persona, hijosPorSuperior, atrasos, cerrados, alternar }) {
  const hijos = hijosPorSuperior[persona.id] || [];
  const susAtrasos = atrasos[persona.id] || [];
  const contraido = cerrados.has(persona.id);
  const desc = contraido ? contarDescendientes(persona.id, hijosPorSuperior, atrasos) : null;
  return (
    <li>
      <div className="nodo-fila">
        {hijos.length > 0 ? (
          <button
            type="button"
            className="btn-contraer"
            aria-expanded={!contraido}
            aria-label={contraido ? 'Expandir' : 'Contraer'}
            title={contraido ? 'Expandir' : 'Contraer'}
            onClick={() => alternar(persona.id)}
          >
            {contraido ? '▸' : '▾'}
          </button>
        ) : (
          <span className="btn-contraer-vacio" />
        )}
      <details className={`persona ${susAtrasos.length > 0 ? 'persona-atrasada' : ''}`}>
        <summary>
          <strong>{nombreCompleto(persona)}</strong>
          <span className={`insignia insignia-${persona.nivel}`}>{NIVELES[persona.nivel]}</span>
          {susAtrasos.map((a) => {
            const fase = FASES.find((f) => f.numero === a.fase);
            return (
              <span
                key={a.fase}
                className="chip-fase chip-atrasada"
                title={`Se pasó ${a.dias} día${a.dias === 1 ? '' : 's'} del tiempo máximo de ${fase.nombre}`}
              >
                Atrasado: {fase.corto} (+{a.dias} d)
              </span>
            );
          })}
          {hijos.length > 0 && !contraido && (
            <small style={{ color: 'var(--gris-texto)' }}>
              {hijos.length} directo{hijos.length === 1 ? '' : 's'}
            </small>
          )}
          {contraido && desc && (
            <>
              <small style={{ color: 'var(--gris-texto)' }}>
                {desc.total} persona{desc.total === 1 ? '' : 's'} oculta{desc.total === 1 ? '' : 's'}
              </small>
              {desc.atrasados > 0 && (
                <span className="chip-fase chip-atrasada">
                  {desc.atrasados} atrasado{desc.atrasados === 1 ? '' : 's'}
                </span>
              )}
            </>
          )}
        </summary>
        <Detalle p={persona} />
      </details>
      </div>
      {hijos.length > 0 && !contraido && (
        <ul>
          {hijos.map((h) => (
            <NodoPersona
              key={h.id}
              persona={h}
              hijosPorSuperior={hijosPorSuperior}
              atrasos={atrasos}
              cerrados={cerrados}
              alternar={alternar}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// Arma el árbol a partir de una lista plana de perfiles aprobados.
export default function PersonaArbol({ perfiles, atrasos = {} }) {
  // Personas cuyos niveles inferiores están contraídos (por defecto todo está expandido).
  const [cerrados, setCerrados] = useState(() => new Set());

  function alternar(id) {
    setCerrados((actual) => {
      const nuevo = new Set(actual);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

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

  const conHijos = Object.keys(hijosPorSuperior);

  return (
    <div>
      {conHijos.length > 0 && (
        <div className="arbol-herramientas">
          <button
            type="button"
            className="boton boton-chico boton-borde"
            onClick={() => setCerrados(new Set())}
          >
            Expandir todo
          </button>
          <button
            type="button"
            className="boton boton-chico boton-borde"
            onClick={() => setCerrados(new Set(conHijos))}
          >
            Contraer todo
          </button>
        </div>
      )}
      <ul className="arbol">
        {raices.map((r) => (
          <NodoPersona
            key={r.id}
            persona={r}
            hijosPorSuperior={hijosPorSuperior}
            atrasos={atrasos}
            cerrados={cerrados}
            alternar={alternar}
          />
        ))}
      </ul>
    </div>
  );
}
