import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Grupos de estudio: ver supabase/grupos.sql. Todo pasa por funciones de Supabase que controlan
// que cada uno solo vea los grupos donde está.

export type Grupo = { id: string; nombre: string; codigo: string };

/** Un grupo donde estoy, con la materia mía que conecté. */
export type MiGrupo = Grupo & { materiaId: string };

export type FilaRanking = {
  usuarioId: string;
  nombre: string;
  horas: number;
  sesiones: number;
  soyYo: boolean;
};

export type Invitacion = { id: string; nombre: string; miembros: number };

function cliente() {
  if (!supabase) throw new Error('Las cuentas no están configuradas');
  return supabase;
}

/** Mensaje de error en español para mostrar. */
export function mensajeGrupos(error: unknown): string {
  const texto = error instanceof Error ? error.message : String(error ?? '');
  if (texto.includes('no existe')) return 'Esa invitación no existe o el grupo se borró.';
  if (texto.includes('No estás en este grupo')) return 'No estás en este grupo.';
  if (texto.includes('iniciar sesión')) return 'Hace falta iniciar sesión.';
  if (texto.toLowerCase().includes('fetch') || texto.toLowerCase().includes('network')) {
    return 'No se pudo conectar. Revisá tu conexión a internet.';
  }
  return 'Algo salió mal. Probá de nuevo en un rato.';
}

export async function misGrupos(usuarioId: string): Promise<MiGrupo[]> {
  const { data, error } = await cliente()
    .from('miembros_grupo')
    .select('materia_id, grupos (id, nombre, codigo)')
    .eq('usuario_id', usuarioId)
    .order('unido_en');
  if (error) throw error;
  return (data ?? []).flatMap((fila) => {
    // Supabase puede devolver la relación como objeto o como lista de uno.
    const g = (Array.isArray(fila.grupos) ? fila.grupos[0] : fila.grupos) as Grupo | null | undefined;
    return g ? [{ id: g.id, nombre: g.nombre, codigo: g.codigo, materiaId: fila.materia_id as string }] : [];
  });
}

export async function crearGrupo(nombreGrupo: string, materiaId: string, miNombre: string): Promise<string> {
  const { data, error } = await cliente().rpc('crear_grupo', {
    nombre_grupo: nombreGrupo,
    materia: materiaId,
    nombre_miembro: miNombre,
  });
  if (error) throw error;
  return data as string;
}

export async function infoInvitacion(codigo: string): Promise<Invitacion | null> {
  const { data, error } = await cliente().rpc('info_invitacion', { codigo_invitacion: codigo });
  if (error) throw error;
  const fila = (data as Invitacion[] | null)?.[0];
  return fila ?? null;
}

export async function unirseGrupo(codigo: string, materiaId: string, miNombre: string): Promise<string> {
  const { data, error } = await cliente().rpc('unirse_grupo', {
    codigo_invitacion: codigo,
    materia: materiaId,
    nombre_miembro: miNombre,
  });
  if (error) throw error;
  return data as string;
}

export async function salirGrupo(grupoId: string): Promise<void> {
  const { error } = await cliente().rpc('salir_grupo', { grupo: grupoId });
  if (error) throw error;
}

/** Ranking del grupo entre `desde` y `hasta` (en milisegundos). Sin fechas: desde siempre. */
export async function rankingGrupo(grupoId: string, desde?: number, hasta?: number): Promise<FilaRanking[]> {
  const { data, error } = await cliente().rpc('ranking_grupo', {
    grupo: grupoId,
    desde: desde ? new Date(desde).toISOString() : null,
    hasta: hasta ? new Date(hasta).toISOString() : null,
  });
  if (error) throw error;
  return ((data ?? []) as { usuario_id: string; nombre: string; horas: number | string; sesiones: number; soy_yo: boolean }[]).map(
    (f) => ({
      usuarioId: f.usuario_id,
      nombre: f.nombre,
      horas: Number(f.horas),
      sesiones: f.sesiones,
      soyYo: f.soy_yo,
    }),
  );
}

/**
 * El link para invitar. Si está configurada la dirección pública de la web (EXPO_PUBLIC_URL_WEB),
 * se usa esa: el link se abre en cualquier celular o compu. Si no, en la web se usa la dirección
 * actual, y en la app un link propio de la app (brote://...).
 */
export function linkInvitacion(codigo: string): string {
  const web = process.env.EXPO_PUBLIC_URL_WEB;
  if (web) return `${web.replace(/\/$/, '')}/unirse/${codigo}`;
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `${window.location.origin}/unirse/${codigo}`;
  return Linking.createURL(`/unirse/${codigo}`);
}

/** Dónde se guarda una invitación pendiente mientras el invitado crea su cuenta. */
export const CLAVE_INVITACION = 'brote:invitacion';
