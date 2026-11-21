export type Materia = {
  id: string;
  nombre: string;
  creditos: number;
  /** Horas para que la planta llegue a su máximo. */
  metaHoras: number;
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
  version: 1;
  materias: Materia[];
  sesiones: Sesion[];
  activa: SesionActiva | null;
};

/** En la UdelaR, 1 crédito equivale a 15 horas de trabajo del estudiante (clases y estudio). */
export const HORAS_POR_CREDITO = 15;

/** Las sesiones más cortas que esto se descartan (por ejemplo, un toque sin querer). */
export const SESION_MINIMA_MS = 10_000;

const MS_POR_HORA = 3_600_000;

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function msEstudiados(
  materiaId: string,
  sesiones: Sesion[],
  activa: SesionActiva | null,
  ahora: number,
): number {
  let total = 0;
  for (const sesion of sesiones) {
    if (sesion.materiaId === materiaId) total += sesion.fin - sesion.inicio;
  }
  if (activa?.materiaId === materiaId) total += Math.max(0, ahora - activa.inicio);
  return total;
}

/** De 0 (semilla) a 1 (planta completa). */
export function calcularProgreso(ms: number, metaHoras: number): number {
  if (metaHoras <= 0) return 0;
  return Math.min(1, ms / (metaHoras * MS_POR_HORA));
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
