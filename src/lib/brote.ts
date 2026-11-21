import type { EspecieId } from '@/lib/especies';

export type Materia = {
  id: string;
  nombre: string;
  /** El árbol que le tocó al plantarla. */
  especie: EspecieId;
  /** Horas por semana para que la planta llegue a su máximo. */
  metaSemanal: number;
  color: string;
  creadaEn: number;
  /**
   * Cuándo se sacó del jardín. Las materias "eliminadas" se archivan en vez de borrarse,
   * para que sus horas sigan contando en las estadísticas del año.
   */
  archivadaEn?: number;
};

export type Sesion = {
  id: string;
  materiaId: string;
  inicio: number;
  fin: number;
  /** true si se agregó a mano (sin cronómetro). */
  manual?: boolean;
};

/** Se guarda la hora de inicio, no un contador: así el tiempo no se pierde si se cierra la app. */
export type SesionActiva = {
  materiaId: string;
  inicio: number;
};

export type EstadoJardin = {
  version: 2;
  materias: Materia[];
  sesiones: Sesion[];
  activa: SesionActiva | null;
  /**
   * Ids de materias y sesiones borradas. Al juntar dos versiones del jardín (la de la nube y la del
   * dispositivo) se suman las dos, y esta lista evita que algo borrado vuelva a aparecer.
   */
  borrados: string[];
  /** Última modificación: al juntar versiones, la sesión en curso sale de la más nueva. */
  modificadoEn: number;
};

/** Dónde se guarda el jardín en el dispositivo: uno para invitado y uno por cada cuenta. */
export function claveJardin(usuarioId: string | null): string {
  return usuarioId ? `brote:jardin:cuenta:${usuarioId}` : 'brote:jardin:v1';
}

/** Las sesiones más cortas que esto se descartan (por ejemplo, un toque sin querer). */
export const SESION_MINIMA_MS = 10_000;

const MS_POR_HORA = 3_600_000;
const MAX_SEMANAS_HISTORIAL = 52;

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Semanas (de lunes a domingo, en hora local) ----------

/** Lunes a las 00:00 de la semana que contiene `ts`. */
export function inicioSemana(ts: number): number {
  const fecha = new Date(ts);
  fecha.setHours(0, 0, 0, 0);
  fecha.setDate(fecha.getDate() - ((fecha.getDay() + 6) % 7));
  return fecha.getTime();
}

/** Suma (o resta, si es negativo) semanas a un inicio de semana. */
export function sumarSemanas(inicio: number, semanas: number): number {
  const fecha = new Date(inicio);
  fecha.setDate(fecha.getDate() + semanas * 7);
  return fecha.getTime();
}

/**
 * Milisegundos estudiados de una materia entre `desde` y `hasta`.
 * Si una sesión cruza el borde (por ejemplo, domingo 23:30 a lunes 00:30), solo cuenta la parte de adentro.
 */
export function msEnRango(
  materiaId: string,
  sesiones: Sesion[],
  activa: SesionActiva | null,
  ahora: number,
  desde: number,
  hasta: number,
): number {
  const solapamiento = (inicio: number, fin: number) =>
    Math.max(0, Math.min(fin, hasta) - Math.max(inicio, desde));

  let total = 0;
  for (const sesion of sesiones) {
    if (sesion.materiaId === materiaId) total += solapamiento(sesion.inicio, sesion.fin);
  }
  if (activa?.materiaId === materiaId) total += solapamiento(activa.inicio, ahora);
  return total;
}

export function msEstaSemana(
  materiaId: string,
  sesiones: Sesion[],
  activa: SesionActiva | null,
  ahora: number,
): number {
  const desde = inicioSemana(ahora);
  return msEnRango(materiaId, sesiones, activa, ahora, desde, sumarSemanas(desde, 1));
}

export type Semana = { inicio: number; ms: number };

/**
 * Horas de cada semana, de la actual hacia atrás, hasta la semana en que se creó la materia
 * (o la de su primera sesión, si es anterior). La primera siempre es la semana actual.
 */
export function historialSemanal(
  materia: Materia,
  sesiones: Sesion[],
  activa: SesionActiva | null,
  ahora: number,
): Semana[] {
  let primera = materia.creadaEn;
  for (const sesion of sesiones) {
    if (sesion.materiaId === materia.id && sesion.inicio < primera) primera = sesion.inicio;
  }
  const limite = inicioSemana(primera);

  const semanas: Semana[] = [];
  let inicio = inicioSemana(ahora);
  do {
    const ms = msEnRango(materia.id, sesiones, activa, ahora, inicio, sumarSemanas(inicio, 1));
    semanas.push({ inicio, ms });
    inicio = sumarSemanas(inicio, -1);
  } while (inicio >= limite && semanas.length < MAX_SEMANAS_HISTORIAL);
  return semanas;
}

// ---------- Totales ----------

/** Progreso de la semana sumando todas las materias (lo que pasa de la meta de una no compensa otra). */
export function progresoGeneral(
  materias: Materia[],
  sesiones: Sesion[],
  activa: SesionActiva | null,
  ahora: number,
): { ms: number; progreso: number; cumplidas: number } {
  let ms = 0;
  let logrado = 0;
  let meta = 0;
  let cumplidas = 0;
  for (const materia of materias) {
    const msMateria = msEstaSemana(materia.id, sesiones, activa, ahora);
    const metaMs = materia.metaSemanal * MS_POR_HORA;
    ms += msMateria;
    logrado += Math.min(msMateria, metaMs);
    meta += metaMs;
    if (metaMs > 0 && msMateria >= metaMs) cumplidas++;
  }
  return { ms, progreso: meta > 0 ? logrado / meta : 0, cumplidas };
}

/** Días seguidos (hasta hoy, o hasta ayer si hoy todavía no estudiaste) con al menos un minuto de estudio. */
export function rachaDias(sesiones: Sesion[], activa: SesionActiva | null, ahora: number): number {
  const clave = (ts: number) => {
    const fecha = new Date(ts);
    return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
  };
  const dias = new Set<string>();
  for (const sesion of sesiones) {
    if (sesion.fin - sesion.inicio >= 60_000) dias.add(clave(sesion.inicio));
  }
  if (activa && ahora - activa.inicio >= 60_000) dias.add(clave(activa.inicio));

  const dia = new Date(ahora);
  if (!dias.has(clave(dia.getTime()))) dia.setDate(dia.getDate() - 1);
  let racha = 0;
  while (dias.has(clave(dia.getTime()))) {
    racha++;
    dia.setDate(dia.getDate() - 1);
  }
  return racha;
}

// ---------- Árbol ----------

/** De 0 (semilla) a 1 (árbol completo): horas de la semana sobre la meta semanal. */
export function calcularProgreso(ms: number, metaSemanal: number): number {
  if (metaSemanal <= 0) return 0;
  return Math.min(1, ms / (metaSemanal * MS_POR_HORA));
}

export function nombreEtapa(progreso: number): string {
  if (progreso <= 0) return 'Semilla';
  if (progreso < 0.1) return 'Brote';
  if (progreso < 0.3) return 'Plantita';
  if (progreso < 0.42) return 'Planta joven';
  if (progreso < 0.66) return 'Arbolito';
  if (progreso < 1) return 'En flor';
  return '¡Florecida!';
}

// ---------- Formatos ----------

/** "0m", "45m", "2h 24m", "3h". */
export function formatoDuracion(ms: number): string {
  const minutos = Math.max(0, Math.floor(ms / 60_000));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto}m`;
  return resto === 0 ? `${horas}h` : `${horas}h ${resto}m`;
}

export function formatoReloj(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const segundos = total % 60;
  const dos = (n: number) => n.toString().padStart(2, '0');
  return horas > 0 ? `${horas}:${dos(minutos)}:${dos(segundos)}` : `${dos(minutos)}:${dos(segundos)}`;
}

export function formatoFecha(ts: number): string {
  return new Date(ts).toLocaleString('es-UY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "17–23 nov", o "28 jul – 3 ago" si la semana cruza de mes. */
export function formatoSemana(inicio: number): string {
  const desde = new Date(inicio);
  const hasta = new Date(inicio);
  hasta.setDate(hasta.getDate() + 6);
  const mes = (fecha: Date) =>
    fecha.toLocaleDateString('es-UY', { month: 'short' }).replace('.', '').toLowerCase();
  if (desde.getMonth() === hasta.getMonth()) {
    return `${desde.getDate()}–${hasta.getDate()} ${mes(hasta)}`;
  }
  return `${desde.getDate()} ${mes(desde)} – ${hasta.getDate()} ${mes(hasta)}`;
}
