export type Materia = {
  id: string;
  nombre: string;
  /** Horas por semana para que la planta llegue a su máximo. */
  metaSemanal: number;
  color: string;
  creadaEn: number;
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
};

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

// ---------- Planta ----------

/** De 0 (semilla) a 1 (planta completa): horas de la semana sobre la meta semanal. */
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

export function formatoHoras(ms: number): string {
  if (ms <= 0) return '0 min';
  const minutos = Math.floor(ms / 60_000);
  if (minutos < 1) return '< 1 min';
  if (minutos < 60) return `${minutos} min`;
  return `${(ms / MS_POR_HORA).toFixed(1).replace('.', ',')} h`;
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
