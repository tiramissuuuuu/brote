import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { guardar, leer } from '@/lib/almacenamiento';
import { nuevoId, SESION_MINIMA_MS, type EstadoJardin, type Materia } from '@/lib/brote';

const CLAVE = 'brote:jardin:v1';
const VACIO: EstadoJardin = { version: 1, materias: [], sesiones: [], activa: null };

function cargar(): EstadoJardin {
  const crudo = leer(CLAVE);
  if (!crudo) return VACIO;
  try {
    const datos = JSON.parse(crudo) as Partial<EstadoJardin>;
    if (datos.version !== 1) return VACIO;
    return {
      version: 1,
      materias: datos.materias ?? [],
      sesiones: datos.sesiones ?? [],
      activa: datos.activa ?? null,
    };
  } catch {
    return VACIO;
  }
}

/** Convierte la sesión en curso (si hay) en una sesión guardada. */
function cerrarActiva(estado: EstadoJardin, ahora: number, id: string): EstadoJardin {
  const { activa } = estado;
  if (!activa) return estado;
  const sesiones =
    ahora - activa.inicio >= SESION_MINIMA_MS
      ? [...estado.sesiones, { id, materiaId: activa.materiaId, inicio: activa.inicio, fin: ahora }]
      : estado.sesiones;
  return { ...estado, sesiones, activa: null };
}

type DatosMateria = Pick<Materia, 'nombre' | 'creditos' | 'metaHoras' | 'color'>;

type ValorJardin = EstadoJardin & {
  agregarMateria: (datos: DatosMateria) => string;
  eliminarMateria: (id: string) => void;
  empezar: (materiaId: string) => void;
  terminar: () => void;
  agregarTiempo: (materiaId: string, minutos: number) => void;
  borrarSesion: (id: string) => void;
};

const ContextoJardin = createContext<ValorJardin | null>(null);

export function ProveedorJardin({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoJardin>(cargar);

  useEffect(() => {
    guardar(CLAVE, JSON.stringify(estado));
  }, [estado]);

  const agregarMateria = (datos: DatosMateria) => {
    const materia: Materia = { ...datos, id: nuevoId(), creadaEn: Date.now() };
    setEstado((e) => ({ ...e, materias: [...e.materias, materia] }));
    return materia.id;
  };

  const eliminarMateria = (id: string) => {
    setEstado((e) => ({
      ...e,
      materias: e.materias.filter((m) => m.id !== id),
      sesiones: e.sesiones.filter((s) => s.materiaId !== id),
      activa: e.activa?.materiaId === id ? null : e.activa,
    }));
  };

  /** Si había otra materia en curso, se termina esa sesión primero. */
  const empezar = (materiaId: string) => {
    const ahora = Date.now();
    const id = nuevoId();
    setEstado((e) => {
      if (e.activa?.materiaId === materiaId) return e;
      return { ...cerrarActiva(e, ahora, id), activa: { materiaId, inicio: ahora } };
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
    setEstado((e) => ({ ...e, sesiones: [...e.sesiones, sesion] }));
  };

  const borrarSesion = (id: string) => {
    setEstado((e) => ({ ...e, sesiones: e.sesiones.filter((s) => s.id !== id) }));
  };

  return (
    <ContextoJardin.Provider
      value={{
        ...estado,
        agregarMateria,
        eliminarMateria,
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
