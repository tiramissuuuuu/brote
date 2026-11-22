import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { inicioSemana, sumarSemanas } from '@/lib/brote';
import { mensajeGrupos, misGrupos, rankingGrupo, type FilaRanking, type MiGrupo } from '@/lib/grupos';
import { useCuenta, type Usuario } from '@/state/cuenta';

/** Cada cuánto se vuelve a pedir el ranking mientras está en pantalla. */
const ACTUALIZAR_RANKING_MS = 30_000;

/** El nombre con el que aparecés en los grupos. */
export function nombreVisible(usuario: Usuario | null): string {
  if (!usuario) return 'Alguien';
  return usuario.nombre ?? usuario.email.split('@')[0];
}

/** Los grupos donde estoy. Se vuelve a pedir cada vez que la pantalla aparece. */
export function useMisGrupos() {
  const { usuario } = useCuenta();
  const id = usuario?.id ?? null;
  const [resultado, setResultado] = useState<{ id: string | null; grupos: MiGrupo[] | null; error: string | null }>({
    id: null,
    grupos: null,
    error: null,
  });
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setVersion((v) => v + 1);
    }, []),
  );

  useEffect(() => {
    if (!id) return;
    let vigente = true;
    misGrupos(id)
      .then((grupos) => vigente && setResultado({ id, grupos, error: null }))
      .catch((e) => vigente && setResultado({ id, grupos: [], error: mensajeGrupos(e) }));
    return () => {
      vigente = false;
    };
  }, [id, version]);

  const actual = resultado.id === id ? resultado : { grupos: null, error: null };
  return {
    grupos: id ? actual.grupos : [],
    cargando: id !== null && actual.grupos === null,
    error: actual.error,
    recargar: () => setVersion((v) => v + 1),
  };
}

export type Periodo = 'semana' | 'total';

/** Ranking de un grupo. Se pide en segundo plano y se actualiza solo cada 30 segundos. */
export function useRanking(grupoId: string | null, periodo: Periodo) {
  const clave = `${grupoId}:${periodo}`;
  const [resultado, setResultado] = useState<{ clave: string; filas: FilaRanking[] | null; error: string | null }>({
    clave: '',
    filas: null,
    error: null,
  });

  useEffect(() => {
    if (!grupoId) return;
    let vigente = true;
    const pedir = () => {
      const desde = periodo === 'semana' ? inicioSemana(Date.now()) : undefined;
      const hasta = desde !== undefined ? sumarSemanas(desde, 1) : undefined;
      rankingGrupo(grupoId, desde, hasta)
        .then((filas) => vigente && setResultado({ clave, filas, error: null }))
        .catch(
          (e) =>
            vigente &&
            setResultado((previo) => ({
              clave,
              // Si falla una actualización, se sigue mostrando lo último que llegó.
              filas: previo.clave === clave ? previo.filas : [],
              error: mensajeGrupos(e),
            })),
        );
    };
    pedir();
    const intervalo = setInterval(pedir, ACTUALIZAR_RANKING_MS);
    return () => {
      vigente = false;
      clearInterval(intervalo);
    };
  }, [grupoId, periodo, clave]);

  const actual = resultado.clave === clave ? resultado : { filas: null, error: null };
  return { filas: actual.filas, cargando: actual.filas === null, error: actual.error };
}

/**
 * Comparte el link de invitación (WhatsApp, etc.). Si el dispositivo no puede compartir
 * (por ejemplo, un navegador de compu), lo copia. Devuelve qué pasó.
 */
export async function compartirInvitacion(nombreGrupo: string, link: string): Promise<'compartido' | 'copiado'> {
  const mensaje = `Sumate a mi grupo "${nombreGrupo}" en Brote para estudiar juntos 🌱 ${link}`;
  try {
    await Share.share({ message: mensaje, url: link });
    return 'compartido';
  } catch {
    await Clipboard.setStringAsync(link);
    return 'copiado';
  }
}
