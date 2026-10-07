'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import FaseEditor from '@/components/FaseEditor';
import {
  ESTADOS_FASE,
  FASES,
  estadoFase,
  nombreCompleto,
  normalizarTexto,
  traducirError,
} from '@/lib/utils';
import './etapas.css';

// Módulo de Etapas.
// - Discípulo: registra sus propias fases.
// - Líder, Pastor base y Pastor: buscan por fase / estado / nombre y registran las fases de sus discípulos.
export default function Etapas({ yo, perfiles }) {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [fase, setFase] = useState('todas');
  const [estado, setEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const cargarFilas = useCallback(async () => {
    try {
      const { data, error: err } = await getSupabase().from('etapas_progreso').select('*');
      if (err) throw err;
      setFilas(data || []);
      setError('');
    } catch (err) {
      setError(traducirError(err));
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarFilas();
  }, [cargarFilas]);

  // perfil_id -> { fase: fila }
  const porPerfil = useMemo(() => {
    const mapa = {};
    filas.forEach((f) => {
      (mapa[f.perfil_id] = mapa[f.perfil_id] || {})[f.fase] = f;
    });
    return mapa;
  }, [filas]);

  const porId = useMemo(() => {
    const mapa = {};
    perfiles.forEach((p) => {
      mapa[p.id] = p;
    });
    return mapa;
  }, [perfiles]);

  const discipulos = useMemo(
    () =>
      perfiles
        .filter((p) => p.nivel === 'discipulo' && p.estado === 'aprobado')
        .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), 'es')),
    [perfiles]
  );

  if (cargando) return <div className="cargando">Cargando etapas…</div>;

  // ---------- Vista del discípulo: sus propias fases ----------
  if (yo.nivel === 'discipulo') {
    const mias = porPerfil[yo.id] || {};
    return (
      <div className="tarjeta">
        <h2>Mis etapas</h2>
        <p className="subtitulo">
          Registra en qué etapa vas y las fechas en que empezaste y terminaste cada una.
        </p>
        <div className="chips-fases" style={{ marginBottom: 12 }}>
          {FASES.map((f) => (
            <span key={f.numero} className={`chip-fase chip-${estadoFase(mias[f.numero])}`}>
              {f.numero}. {f.corto}: {ESTADOS_FASE[estadoFase(mias[f.numero])]}
            </span>
          ))}
        </div>
        {error && <div className="mensaje mensaje-error">{error}</div>}
        <FaseEditor perfilId={yo.id} filas={Object.values(mias)} onGuardado={cargarFilas} />
      </div>
    );
  }

  // ---------- Vista de líderes y pastores ----------
  const resumen = FASES.map((f) => {
    let enCurso = 0;
    let completadas = 0;
    discipulos.forEach((d) => {
      const e = estadoFase((porPerfil[d.id] || {})[f.numero]);
      if (e === 'en_curso') enCurso += 1;
      if (e === 'completada') completadas += 1;
    });
    return { ...f, enCurso, completadas };
  });

  const texto = normalizarTexto(busqueda.trim());

  function coincide(d) {
    if (texto && !normalizarTexto(`${nombreCompleto(d)} ${d.nombre_usuario}`).includes(texto)) {
      return false;
    }
    const mias = porPerfil[d.id] || {};

    if (fase === 'todas') {
      if (estado === 'todos') return true;
      const lista = Object.values(mias);
      if (estado === 'sin_iniciar') return lista.length === 0;
      return lista.some((f) => estadoFase(f) === estado);
    }

    const f = mias[fase];
    if (estado === 'todos') return !!f; // la ha iniciado (en curso o completada)
    if (estado === 'sin_iniciar') return !f;
    return estadoFase(f) === estado;
  }

  const visibles = discipulos.filter(coincide);
  const hayFiltros = fase !== 'todas' || estado !== 'todos' || texto;

  function limpiar() {
    setFase('todas');
    setEstado('todos');
    setBusqueda('');
  }

  return (
    <div>
      <div className="etapas-resumen">
        {resumen.map((f) => (
          <button
            key={f.numero}
            type="button"
            className={`tile-fase ${fase === f.numero ? 'tile-fase-activa' : ''}`}
            onClick={() => {
              setFase(fase === f.numero ? 'todas' : f.numero);
              setEstado('todos');
            }}
          >
            <span className="tile-numero">{f.numero}</span>
            <strong>{f.corto}</strong>
            <small>
              {f.enCurso} en curso · {f.completadas} completada{f.completadas === 1 ? '' : 's'}
            </small>
          </button>
        ))}
      </div>

      <div className="tarjeta">
        <h2>Buscar por fase</h2>

        <div className="filtros">
          <div className="campo">
            <label htmlFor="filtro-fase">Fase</label>
            <select
              id="filtro-fase"
              value={fase}
              onChange={(e) => setFase(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
            >
              <option value="todas">Todas las fases</option>
              {FASES.map((f) => (
                <option key={f.numero} value={f.numero}>
                  {f.numero}. {f.corto}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="filtro-estado">Estado</label>
            <select id="filtro-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="todos">
                {fase === 'todas' ? 'Cualquiera' : 'Iniciada (en curso o completada)'}
              </option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completada</option>
              <option value="sin_iniciar">Sin iniciar</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="filtro-nombre">Nombre</label>
            <input
              id="filtro-nombre"
              type="search"
              placeholder="Buscar por nombre o usuario…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <p className="etapas-cuenta">
          {visibles.length} de {discipulos.length} discípulo{discipulos.length === 1 ? '' : 's'}
          {hayFiltros && (
            <>
              {' · '}
              <button
                type="button"
                className="boton boton-chico boton-borde"
                onClick={limpiar}
                style={{ marginLeft: 4 }}
              >
                Limpiar filtros
              </button>
            </>
          )}
        </p>

        {error && <div className="mensaje mensaje-error">{error}</div>}

        {discipulos.length === 0 ? (
          <p className="vacio">Todavía no hay discípulos aprobados en tu red.</p>
        ) : visibles.length === 0 ? (
          <p className="vacio">Ningún discípulo coincide con la búsqueda.</p>
        ) : (
          <ul className="lista-etapas">
            {visibles.map((d) => {
              const mias = porPerfil[d.id] || {};
              const lider = porId[d.superior_id];
              return (
                <li key={d.id}>
                  <details className="persona">
                    <summary>
                      <strong>{nombreCompleto(d)}</strong>
                      <span className="chips-fases">
                        {FASES.map((f) => (
                          <span
                            key={f.numero}
                            className={`chip-fase chip-${estadoFase(mias[f.numero])}`}
                            title={`${f.nombre}: ${ESTADOS_FASE[estadoFase(mias[f.numero])]}`}
                          >
                            {f.numero}. {f.corto}
                          </span>
                        ))}
                      </span>
                      {lider && <span className="persona-sub">Líder: {nombreCompleto(lider)}</span>}
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      <FaseEditor perfilId={d.id} filas={Object.values(mias)} onGuardado={cargarFilas} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
