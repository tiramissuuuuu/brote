import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { guardar, leer, quitar } from '@/lib/almacenamiento';
import {
  claveJardin,
  nuevoId,
  SESION_MINIMA_MS,
  type EstadoJardin,
  type Materia,
  type Sesion,
  type SesionActiva,
} from '@/lib/brote';
import { esEspecie, especieAlAzar, especieDesdeTexto } from '@/lib/especies';
import { bajarJardin, subirJardin } from '@/lib/nube';
import { useCuenta } from '@/state/cuenta';

/** Si falla la conexión con la nube, se vuelve a intentar cada tanto. */
const REINTENTO_MS = 15_000;

const vacio = (): EstadoJardin => ({
  version: 2,
  materias: [],
  sesiones: [],
  activa: null,
  borrados: [],
  modificadoEn: 0,
});

/** Una materia tal como puede venir guardada, incluso en formatos viejos. */
type MateriaGuardada = Partial<Materia> &
  Pick<Materia, 'id' | 'nombre' | 'color' | 'creadaEn'> & { creditos?: number; metaHoras?: number };

function normalizarMateria(m: MateriaGuardada): Materia {
  let metaSemanal = m.metaSemanal;
  if (!metaSemanal || metaSemanal <= 0) {
    // Versión 1: meta del semestre con créditos. Más o menos 1 hora por semana por crédito.
    metaSemanal = m.creditos && m.creditos > 0 ? m.creditos : Math.max(1, Math.round((m.metaHoras ?? 15) / 15));
  }
  return {
    id: m.id,
    nombre: m.nombre,
    color: m.color,
    creadaEn: m.creadaEn,
    metaSemanal,
    // Las materias de antes de que hubiera especies reciben siempre la misma, según su id.
    especie: esEspecie(m.especie) ? m.especie : especieDesdeTexto(m.id),
    ...(typeof m.archivadaEn === 'number' ? { archivadaEn: m.archivadaEn } : {}),
  };
}

/** Acepta los formatos viejos y los pasa al actual. Devuelve null si no es un jardín. */
function normalizar(datos: unknown): EstadoJardin | null {
  if (!datos || typeof datos !== 'object') return null;
  const d = datos as {
    version?: number;
    materias?: MateriaGuardada[];
    sesiones?: Sesion[];
    activa?: SesionActiva | null;
    borrados?: string[];
    modificadoEn?: number;
  };
  if (d.version !== 1 && d.version !== 2) return null;
  return {
    version: 2,
    materias: (d.materias ?? []).map(normalizarMateria),
    sesiones: d.sesiones ?? [],
    activa: d.activa ?? null,
    borrados: d.borrados ?? [],
    modificadoEn: d.modificadoEn ?? 0,
  };
}

function cargar(clave: string): EstadoJardin {
  const crudo = leer(clave);
  if (!crudo) return vacio();
  try {
    return normalizar(JSON.parse(crudo)) ?? vacio();
  } catch {
    return vacio();
  }
}

const tieneDatos = (e: EstadoJardin) => e.materias.length > 0 || e.sesiones.length > 0;

/**
 * Junta dos jardines sumando materias y sesiones (sin repetir y sin lo borrado en cualquiera de los dos).
 * Así no se pierde nada aunque se haya usado la app en dos dispositivos, o sin conexión.
 */
function juntar(a: EstadoJardin, b: EstadoJardin, activa: SesionActiva | null, modificadoEn: number): EstadoJardin {
  const borrados = new Set([...a.borrados, ...b.borrados]);
  const unir = <T extends { id: string }>(lista: T[]) => {
    const vistos = new Set<string>();
    return lista.filter((item) => {
      if (vistos.has(item.id) || borrados.has(item.id)) return false;
      vistos.add(item.id);
      return true;
    });
  };
  // Si una copia tiene la materia archivada y la otra no, queda archivada (archivar no se deshace).
  const porId = new Map<string, Materia>();
  for (const m of [...a.materias, ...b.materias]) {
    if (borrados.has(m.id)) continue;
    const previa = porId.get(m.id);
    porId.set(m.id, previa && !previa.archivadaEn && m.archivadaEn ? { ...previa, archivadaEn: m.archivadaEn } : (previa ?? m));
  }
  const materias = [...porId.values()].sort((x, y) => x.creadaEn - y.creadaEn);
  return {
    version: 2,
    materias,
    sesiones: unir([...a.sesiones, ...b.sesiones]),
    activa: activa && materias.some((m) => m.id === activa.materiaId) ? activa : null,
    borrados: [...borrados],
    modificadoEn,
  };
}

/** Dos copias del jardín de la misma cuenta (la de la nube y la del dispositivo). */
function juntarCopias(a: EstadoJardin, b: EstadoJardin): EstadoJardin {
  // La sesión en curso sale de la copia más nueva (si la terminaste en otro lado, no vuelve).
  const nueva = a.modificadoEn >= b.modificadoEn ? a : b;
  return juntar(a, b, nueva.activa, Math.max(a.modificadoEn, b.modificadoEn));
}

/** Lo que tenías como invitado pasa a la cuenta. */
function pasarInvitado(cuenta: EstadoJardin, invitado: EstadoJardin): EstadoJardin {
  if (!tieneDatos(invitado)) return cuenta;
  return juntar(cuenta, invitado, cuenta.activa ?? invitado.activa, Math.max(cuenta.modificadoEn, invitado.modificadoEn));
}

/** El jardín de una cuenta en este dispositivo, sumando lo de invitado que todavía no se pasó. */
function cargarCuenta(clave: string): EstadoJardin {
  return pasarInvitado(cargar(clave), cargar(claveJardin(null)));
}

/** Convierte la sesión en curso (si hay) en una sesión guardada. */
function cerrarActiva(estado: EstadoJardin, ahora: number, id: string): EstadoJardin {
  const { activa } = estado;
  if (!activa) return estado;
  const sesiones =
    ahora - activa.inicio >= SESION_MINIMA_MS
      ? [...estado.sesiones, { id, materiaId: activa.materiaId, inicio: activa.inicio, fin: ahora }]
      : estado.sesiones;
  return { ...estado, sesiones, activa: null, modificadoEn: ahora };
}

/**
 * - solo-dispositivo: modo invitado.
 * - sincronizando: bajando o subiendo cambios.
 * - guardado: todo está en la nube.
 * - sin-conexion: no se pudo hablar con la nube; los cambios quedan en el dispositivo.
 */
export type EstadoNube = 'solo-dispositivo' | 'sincronizando' | 'guardado' | 'sin-conexion';

type DatosMateria = Pick<Materia, 'nombre' | 'metaSemanal' | 'color'>;

type ValorJardin = EstadoJardin & {
  /** Las materias del jardín (sin las archivadas). Es lo que muestran las pantallas. */
  materias: Materia[];
  /** Todas, incluidas las archivadas: para estadísticas (por ejemplo, el resumen del año). */
  todasLasMaterias: Materia[];
  nube: EstadoNube;
  /** Planta la materia con una especie al azar y la devuelve. */
  agregarMateria: (datos: DatosMateria) => Materia;
  archivarMateria: (id: string) => void;
  empezar: (materiaId: string) => void;
  terminar: () => void;
  agregarTiempo: (materiaId: string, minutos: number) => void;
  borrarSesion: (id: string) => void;
};

const ContextoJardin = createContext<ValorJardin | null>(null);

export function ProveedorJardin({ children }: { children: ReactNode }) {
  const { usuario } = useCuenta();
  const usuarioId = usuario?.id ?? null;
  const clave = claveJardin(usuarioId);

  const cargarDueno = () => (usuarioId ? cargarCuenta(clave) : cargar(clave));

  const [dueno, setDueno] = useState(clave);
  const [estado, setEstado] = useState(cargarDueno);
  // Con cuenta, no se sube nada hasta haber bajado lo que hay en la nube (para no pisarlo).
  const [nubeLista, setNubeLista] = useState(false);
  const [nube, setNube] = useState<EstadoNube>('solo-dispositivo');
  // Se incrementa para volver a intentar la subida después de un error de conexión.
  const [intentoSubida, setIntentoSubida] = useState(0);

  // Al entrar o salir de una cuenta, se carga el jardín de esa cuenta (o el de invitado).
  // Al entrar, lo de invitado se muestra enseguida, sin esperar a la nube.
  if (dueno !== clave) {
    setDueno(clave);
    setEstado(cargarDueno());
    setNubeLista(false);
    setNube(usuarioId ? 'sincronizando' : 'solo-dispositivo');
  }

  // Bajar el jardín de la nube al entrar a una cuenta.
  useEffect(() => {
    if (!usuarioId) return;
    let cancelado = false;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    const sincronizar = async () => {
      try {
        const remoto = normalizar(await bajarJardin(usuarioId));
        if (cancelado) return;
        const invitado = cargar(claveJardin(null));
        // Se suma lo de la nube con lo del dispositivo (por si hubo cambios sin conexión o en otro
        // dispositivo), y lo que tenías como invitado pasa a tu cuenta.
        setEstado((local) => pasarInvitado(remoto ? juntarCopias(remoto, local) : local, invitado));
        if (tieneDatos(invitado)) quitar(claveJardin(null));
        setNubeLista(true);
        setNube('guardado');
      } catch {
        if (cancelado) return;
        setNube('sin-conexion');
        reintento = setTimeout(sincronizar, REINTENTO_MS);
      }
    };
    sincronizar();
    return () => {
      cancelado = true;
      clearTimeout(reintento);
    };
  }, [usuarioId]);

  // Siempre se guarda en el dispositivo.
  useEffect(() => {
    guardar(clave, JSON.stringify(estado));
  }, [clave, estado]);

  // Con cuenta, además se sube a la nube (esperando un momento por si hay varios cambios seguidos).
  useEffect(() => {
    if (!usuarioId || !nubeLista) return;
    let cancelado = false;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    const temporizador = setTimeout(async () => {
      setNube('sincronizando');
      try {
        await subirJardin(usuarioId, estado);
        if (!cancelado) setNube('guardado');
      } catch {
        if (cancelado) return;
        setNube('sin-conexion');
        reintento = setTimeout(() => setIntentoSubida((n) => n + 1), REINTENTO_MS);
      }
    }, 800);
    return () => {
      cancelado = true;
      clearTimeout(temporizador);
      clearTimeout(reintento);
    };
  }, [usuarioId, nubeLista, estado, intentoSubida]);

  const agregarMateria = (datos: DatosMateria) => {
    const ahora = Date.now();
    const materia: Materia = { ...datos, id: nuevoId(), especie: especieAlAzar(), creadaEn: ahora };
    setEstado((e) => ({ ...e, materias: [...e.materias, materia], modificadoEn: ahora }));
    return materia;
  };

  /** La saca del jardín, pero guarda sus sesiones para las estadísticas (si se estaba estudiando, se termina). */
  const archivarMateria = (id: string) => {
    const ahora = Date.now();
    const idSesion = nuevoId();
    setEstado((e) => {
      const base = e.activa?.materiaId === id ? cerrarActiva(e, ahora, idSesion) : e;
      return {
        ...base,
        materias: base.materias.map((m) => (m.id === id ? { ...m, archivadaEn: ahora } : m)),
        modificadoEn: ahora,
      };
    });
  };

  /** Si había otra materia en curso, se termina esa sesión primero. */
  const empezar = (materiaId: string) => {
    const ahora = Date.now();
    const id = nuevoId();
    setEstado((e) => {
      if (e.activa?.materiaId === materiaId) return e;
      return { ...cerrarActiva(e, ahora, id), activa: { materiaId, inicio: ahora }, modificadoEn: ahora };
    });
  };

  const terminar = () => {
    const ahora = Date.now();
    const id = nuevoId();
    setEstado((e) => cerrarActiva(e, ahora, id));
  };

  const agregarTiempo = (materiaId: string, minutos: number) => {
    const fin = Date.now();
    const sesion = { id: nuevoId(), materiaId, inicio: fin - minutos * 60_000, fin, manual: true };
    setEstado((e) => ({ ...e, sesiones: [...e.sesiones, sesion], modificadoEn: fin }));
  };

  const borrarSesion = (id: string) => {
    const ahora = Date.now();
    setEstado((e) => ({
      ...e,
      sesiones: e.sesiones.filter((s) => s.id !== id),
      borrados: [...e.borrados, id],
      modificadoEn: ahora,
    }));
  };

  return (
    <ContextoJardin.Provider
      value={{
        ...estado,
        materias: estado.materias.filter((m) => !m.archivadaEn),
        todasLasMaterias: estado.materias,
        nube,
        agregarMateria,
        archivarMateria,
        empezar,
        terminar,
        agregarTiempo,
        borrarSesion,
      }}>
      {children}
    </ContextoJardin.Provider>
  );
}

export function useJardin(): ValorJardin {
  const valor = useContext(ContextoJardin);
  if (!valor) throw new Error('useJardin tiene que usarse dentro de <ProveedorJardin>');
  return valor;
}
