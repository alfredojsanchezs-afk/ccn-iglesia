export const NIVELES = {
  pastor: 'Pastor',
  pastor_base: 'Pastor base',
  lider: 'Líder',
  discipulo: 'Discípulo',
};

// Nivel que debe tener el superior de cada nivel.
export const NIVEL_SUPERIOR = {
  pastor_base: 'pastor',
  lider: 'pastor_base',
  discipulo: 'lider',
};

export const ESTADOS = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

// Las cuatro fases (etapas) que cursa cada discípulo.
// `duracion` es el tiempo máximo para culminar la fase (se cuenta desde la fecha de inicio).
export const FASES = [
  {
    numero: 1,
    corto: 'Ruta al Éxito',
    nombre: 'Ruta al Éxito',
    detalle: '',
    duracion: { dias: 7 * 7 },
    duracionTexto: '7 semanas',
  },
  {
    numero: 2,
    corto: 'ESFORDI',
    nombre: 'ESFORDI',
    detalle: 'Escuela de Formación Discipular',
    duracion: { dias: 9 * 7 },
    duracionTexto: '9 semanas',
  },
  {
    numero: 3,
    corto: 'ADN CCN',
    nombre: 'ADN CCN',
    detalle: '',
    duracion: { dias: 1 },
    duracionTexto: '1 día',
  },
  {
    numero: 4,
    corto: 'ESFORMI',
    nombre: 'ESFORMI',
    detalle: 'Escuela de Formación Ministerial',
    duracion: { anios: 1 },
    duracionTexto: '1 año',
  },
];

function aFechaLocal(iso) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return new Date(anio, mes - 1, dia);
}

function aISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

// Fecha límite (AAAA-MM-DD) para culminar una fase iniciada en `inicioISO`.
export function fechaLimite(numeroFase, inicioISO) {
  const fase = FASES.find((f) => f.numero === numeroFase);
  if (!fase || !inicioISO) return null;
  const limite = aFechaLocal(inicioISO);
  if (fase.duracion.dias) limite.setDate(limite.getDate() + fase.duracion.dias);
  if (fase.duracion.anios) limite.setFullYear(limite.getFullYear() + fase.duracion.anios);
  return aISO(limite);
}

// Días de retraso de una fase en curso (0 si no está atrasada, está completada o no existe).
export function diasDeRetraso(fila) {
  if (!fila || fila.fecha_fin) return 0;
  const limite = fechaLimite(fila.fase, fila.fecha_inicio);
  if (!limite) return 0;
  const hoy = new Date();
  const hoyLocal = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.floor((hoyLocal - aFechaLocal(limite)) / 86400000);
  return dias > 0 ? dias : 0;
}

// Atrasos de una persona a partir de sus filas: [{ fase: 2, dias: 5 }, ...]
export function atrasosDeFilas(filasPersona) {
  const lista = [];
  (filasPersona || []).forEach((f) => {
    const dias = diasDeRetraso(f);
    if (dias > 0) lista.push({ fase: f.fase, dias });
  });
  return lista;
}

// Atrasos de todos: { perfil_id: [{ fase, dias }] }
export function calcularAtrasos(filas) {
  const resultado = {};
  (filas || []).forEach((f) => {
    const dias = diasDeRetraso(f);
    if (dias > 0) (resultado[f.perfil_id] = resultado[f.perfil_id] || []).push({ fase: f.fase, dias });
  });
  return resultado;
}

export function textoDias(dias) {
  return `${dias} día${dias === 1 ? '' : 's'}`;
}

export const ESTADOS_FASE = {
  sin_iniciar: 'Sin iniciar',
  en_curso: 'En curso',
  completada: 'Completada',
};

// Estado de una fase según su fila en la base de datos (o undefined si no existe).
export function estadoFase(fila) {
  if (!fila) return 'sin_iniciar';
  return fila.fecha_fin ? 'completada' : 'en_curso';
}

// Estado para mostrar en pantalla: igual que estadoFase, pero 'atrasada' si pasó su tiempo máximo.
export function estadoVisualFase(fila) {
  return diasDeRetraso(fila) > 0 ? 'atrasada' : estadoFase(fila);
}

// Fecha de hoy en formato AAAA-MM-DD (hora local).
export function hoyISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// Quita acentos y mayúsculas para buscar por nombre.
export function normalizarTexto(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

// Calcula la edad a partir de la fecha de nacimiento (formato AAAA-MM-DD).
export function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - anio;
  const antesDeCumple =
    hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia);
  if (antesDeCumple) edad -= 1;
  return edad >= 0 ? edad : null;
}

export function formatearFecha(fecha) {
  if (!fecha) return '';
  const [anio, mes, dia] = fecha.split('-');
  return `${dia}/${mes}/${anio}`;
}

export function nombreCompleto(p) {
  return `${p.nombres} ${p.apellidos}`;
}

// Traduce errores comunes de Supabase al español.
export function traducirError(error) {
  const msg = (error && error.message ? error.message : String(error || '')).toLowerCase();
  if (msg.includes('invalid login credentials')) return 'Usuario o contraseña incorrectos.';
  if (msg.includes('user already registered')) return 'Ya existe una cuenta con ese correo.';
  if (msg.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (msg.includes('unable to validate email') || msg.includes('invalid email')) return 'El correo no es válido.';
  if (msg.includes('email not confirmed')) return 'Debes confirmar tu correo antes de entrar.';
  if (msg.includes('superior')) return 'Debes elegir un superior válido.';
  if (msg.includes('rate limit')) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (msg.includes('database error saving new user')) {
    return 'No se pudo crear la cuenta. Revisa que el correo y el usuario no estén repetidos.';
  }
  if (msg.includes('faltan las variables')) return 'La web aún no está conectada a Supabase (faltan las variables de entorno).';
  return 'Ocurrió un error: ' + (error && error.message ? error.message : 'intenta de nuevo.');
}
