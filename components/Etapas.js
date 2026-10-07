'use client';

import { useMemo, useState } from 'react';
import FaseEditor from '@/components/FaseEditor';
import {
  ESTADOS_FASE,
  FASES,
  atrasosDeFilas,
  diasDeRetraso,
  estadoFase,
  estadoVisualFase,
  nombreCompleto,
  normalizarTexto,
} from '@/lib/utils';
import './etapas.css';

// Módulo de Etapas.
// - Discípulo: registra sus propias fases.
// - Líder, Pastor base y Pastor: buscan por fase / estado / nombre y registran las fases de sus discípulos.
// Las filas de etapas se cargan en el panel y llegan por `filas`; `onCambio` las vuelve a cargar.
export default function Etapas({ yo, perfiles, filas, onCambio }) {
  const [fase, setFase] = useState('todas');
  const [estado, setEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

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

  // ---------- Vista del discípulo: sus propias fases ----------
  if (yo.nivel === 'discipulo') {
    const mias = porPerfil[yo.id] || {};
    const etiquetaEstado = (f) =>
      estadoVisualFase(mias[f.numero]) === 'atrasada'
        ? 'Atrasada'
        : ESTADOS_FASE[estadoFase(mias[f.numero])];
    return (
      <div className="tarjeta">
        <h2>Mis etapas</h2>
        <p className="subtitulo">
          Registra en qué etapa vas y las fechas en que empezaste y terminaste cada una. Cada etapa tiene
          un tiempo máximo para culminar.
        </p>
        <div className="chips-fases" style={{ marginBottom: 12 }}>
          {FASES.map((f) => (
            <span key={f.numero} className={`chip-fase chip-${estadoVisualFase(mias[f.numero])}`}>
              {f.numero}. {f.corto}: {etiquetaEstado(f)}
            </span>
          ))}
        </div>
        <FaseEditor perfilId={yo.id} filas={Object.values(mias)} onGuardado={onCambio} />
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

  const totalAtrasados = discipulos.filter(
    (d) => atrasosDeFilas(Object.values(porPerfil[d.id] || {})).length > 0
  ).length;

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
      if (estado === 'atrasado') return atrasosDeFilas(lista).length > 0;
      return lista.some((f) => estadoFase(f) === estado);
    }

    const f = mias[fase];
    if (estado === 'todos') return !!f; // la ha iniciado (en curso o completada)
    if (estado === 'sin_iniciar') return !f;
    if (estado === 'atrasado') return diasDeRetraso(f) > 0;
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
            className={`tile-fase ${fase === f.numero && estado !== 'atrasado' ? 'tile-fase-activa' : ''}`}
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
            <small>Máximo: {f.duracionTexto}</small>
          </button>
        ))}

        <button
          type="button"
          className={`tile-fase tile-atrasados ${
            fase === 'todas' && estado === 'atrasado' ? 'tile-fase-activa' : ''
          }`}
          onClick={() => {
            setFase('todas');
            setEstado(fase === 'todas' && estado === 'atrasado' ? 'todos' : 'atrasado');
          }}
        >
          <span className="tile-numero">!</span>
          <strong>Atrasados</strong>
          <small>
            {totalAtrasados} discípulo{totalAtrasados === 1 ? '' : 's'}
          </small>
          <small>Pasaron el tiempo máximo</small>
        </button>
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
              <option value="atrasado">Atrasados</option>
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

        {discipulos.length === 0 ? (
          <p className="vacio">Todavía no hay discípulos aprobados en tu red.</p>
        ) : visibles.length === 0 ? (
          <p className="vacio">Ningún discípulo coincide con la búsqueda.</p>
        ) : (
          <ul className="lista-etapas">
            {visibles.map((d) => {
              const mias = porPerfil[d.id] || {};
              const lider = porId[d.superior_id];
              const atrasado = atrasosDeFilas(Object.values(mias)).length > 0;
              return (
                <li key={d.id}>
                  <details className={`persona ${atrasado ? 'persona-atrasada' : ''}`}>
                    <summary>
                      <strong>{nombreCompleto(d)}</strong>
                      <span className="chips-fases">
                        {FASES.map((f) => {
                          const visual = estadoVisualFase(mias[f.numero]);
                          const dias = diasDeRetraso(mias[f.numero]);
                          return (
                            <span
                              key={f.numero}
                              className={`chip-fase chip-${visual}`}
                              title={`${f.nombre}: ${
                                visual === 'atrasada' ? 'Atrasada' : ESTADOS_FASE[estadoFase(mias[f.numero])]
                              }`}
                            >
                              {f.numero}. {f.corto}
                              {dias > 0 && ` (+${dias} d)`}
                            </span>
                          );
                        })}
                      </span>
                      {lider && <span className="persona-sub">Líder: {nombreCompleto(lider)}</span>}
                    </summary>
                    <div style={{ marginTop: 10 }}>
                      <FaseEditor perfilId={d.id} filas={Object.values(mias)} onGuardado={onCambio} />
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
