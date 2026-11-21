import type { EstadoJardin } from '@/lib/brote';
import { supabase } from '@/lib/supabase';

// Cada usuario tiene una fila en la tabla `jardines` con todo su jardín en formato JSON.
// Es lo más simple para empezar; si más adelante hacen falta estadísticas entre usuarios,
// conviene pasar a tablas separadas de materias y sesiones.

export async function bajarJardin(usuarioId: string): Promise<unknown | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('jardines')
    .select('datos')
    .eq('usuario_id', usuarioId)
    .maybeSingle();
  if (error) throw error;
  return data?.datos ?? null;
}

export async function subirJardin(usuarioId: string, datos: EstadoJardin): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('jardines')
    .upsert({ usuario_id: usuarioId, datos, actualizado_en: new Date().toISOString() });
  if (error) throw error;
}
