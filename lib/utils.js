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
