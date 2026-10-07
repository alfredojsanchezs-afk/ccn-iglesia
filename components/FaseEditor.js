'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { ESTADOS_FASE, FASES, estadoFase, hoyISO, traducirError } from '@/lib/utils';

// Una fase de una persona: fechas de inicio y fin, con botones rápidos.
function FaseFila({ perfilId, fase, fila, onGuardado, onError }) {
  const [inicio, setInicio] = useState(fila ? fila.fecha_inicio : '');
  const [fin, setFin] = useState(fila && fila.fecha_fin ? fila.fecha_fin : '');
  const [trabajando, setTrabajando] = useState(false);
  const estado = estadoFase(fila);

  async function guardar(valorInicio, valorFin) {
    onError('');
    if (!valorInicio) {
      onError('Indica la fecha de inicio de la fase.');
      return;
    }
    if (valorFin && valorFin < valorInicio) {
      onError('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }
    setTrabajando(true);
    try {
      const { error } = await getSupabase()
        .from('etapas_progreso')
        .upsert(
          {
            perfil_id: perfilId,
            fase: fase.numero,
            fecha_inicio: valorInicio,
            fecha_fin: valorFin || null,
          },
          { onConflict: 'perfil_id,fase' }
        );
      if (error) throw error;
      await onGuardado();
    } catch (err) {
      onError(traducirError(err));
    }
    setTrabajando(false);
  }

  async function quitar() {
    if (!window.confirm(`¿Quitar el registro de ${fase.corto}?`)) return;
    onError('');
    setTrabajando(true);
    try {
      const { error } = await getSupabase()
        .from('etapas_progreso')
        .delete()
        .eq('perfil_id', perfilId)
        .eq('fase', fase.numero);
      if (error) throw error;
      setInicio('');
      setFin('');
      await onGuardado();
    } catch (err) {
      onError(traducirError(err));
    }
    setTrabajando(false);
  }

  const hoy = hoyISO();

  return (
    <div className="fase-fila">
      <div className="fase-nombre">
        <strong>
          {fase.numero}. {fase.nombre}
        </strong>
        {fase.detalle && <small>{fase.detalle}</small>}
        <span className={`chip-fase chip-${estado}`}>{ESTADOS_FASE[estado]}</span>
      </div>

      <div className="campo-mini">
        <label htmlFor={`ini-${perfilId}-${fase.numero}`}>Fecha de inicio</label>
        <input
          id={`ini-${perfilId}-${fase.numero}`}
          type="date"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
      </div>

      <div className="campo-mini">
        <label htmlFor={`fin-${perfilId}-${fase.numero}`}>Fecha de fin</label>
        <input
          id={`fin-${perfilId}-${fase.numero}`}
          type="date"
          value={fin}
          min={inicio || undefined}
          onChange={(e) => setFin(e.target.value)}
        />
      </div>

      <div className="fase-acciones">
        {estado === 'sin_iniciar' && (
          <button
            type="button"
            className="boton boton-chico boton-azul"
            disabled={trabajando}
            onClick={() => guardar(hoy, '')}
          >
            Iniciar hoy
          </button>
        )}
        {estado === 'en_curso' && (
          <button
            type="button"
            className="boton boton-chico boton-azul"
            disabled={trabajando}
            onClick={() => guardar(inicio, hoy < inicio ? inicio : hoy)}
          >
            Completar hoy
          </button>
        )}
        <button
          type="button"
          className="boton boton-chico"
          disabled={trabajando}
          onClick={() => guardar(inicio, fin)}
        >
          Guardar
        </button>
        {fila && (
          <button
            type="button"
            className="boton boton-chico boton-borde"
            disabled={trabajando}
            onClick={quitar}
          >
            Quitar
          </button>
        )}
      </div>
    </div>
  );
}

// Las cuatro fases de un discípulo. `filas` = filas de etapas_progreso de esa persona.
export default function FaseEditor({ perfilId, filas, onGuardado }) {
  const [error, setError] = useState('');
  const porFase = {};
  (filas || []).forEach((f) => {
    porFase[f.fase] = f;
  });

  return (
    <div>
      {error && <div className="mensaje mensaje-error">{error}</div>}
      {FASES.map((fase) => {
        const fila = porFase[fase.numero];
        return (
          <FaseFila
            key={`${perfilId}-${fase.numero}-${fila ? fila.fecha_inicio : ''}-${
              fila && fila.fecha_fin ? fila.fecha_fin : ''
            }`}
            perfilId={perfilId}
            fase={fase}
            fila={fila}
            onGuardado={onGuardado}
            onError={setError}
          />
        );
      })}
    </div>
  );
}
