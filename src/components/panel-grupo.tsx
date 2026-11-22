import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Panel } from '@/components/panel';
import { RankingLista } from '@/components/ranking-lista';
import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';
import { compartirInvitacion, nombreVisible, useMisGrupos, useRanking } from '@/hooks/use-grupos';
import type { Materia } from '@/lib/brote';
import { crearGrupo, linkInvitacion, mensajeGrupos } from '@/lib/grupos';
import { useCuenta } from '@/state/cuenta';

/** Recuadro en la pantalla de la materia: crear un grupo, o ver el ranking del grupo e invitar. */
export function PanelGrupo({ materia }: { materia: Materia }) {
  const router = useRouter();
  const { estado, usuario, nubeDisponible } = useCuenta();
  const { grupos, cargando } = useMisGrupos();
  const grupo = grupos?.find((g) => g.materiaId === materia.id) ?? null;
  const { filas } = useRanking(grupo?.id ?? null, 'semana');
  const [creando, setCreando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!nubeDisponible) return null;

  if (estado !== 'conectado') {
    return (
      <Panel
        titulo="👥 Estudiá en grupo"
        subtitulo="Creá un grupo para esta materia, invitá a tus compañeros con un link y compitan por horas. Necesitás una cuenta (tus árboles se pasan solos).">
        <Boton titulo="Crear cuenta" variante="claro" onPress={() => router.push('/registro')} />
      </Panel>
    );
  }

  if (cargando) {
    return (
      <Panel titulo="👥 Grupo de estudio">
        <Texto variante="chico" color={Colores.blancoSuave}>
          Cargando…
        </Texto>
      </Panel>
    );
  }

  if (!grupo) {
    const crear = async () => {
      setCreando(true);
      setAviso(null);
      try {
        const id = await crearGrupo(materia.nombre, materia.id, nombreVisible(usuario));
        router.push({ pathname: '/grupo/[id]', params: { id, nuevo: '1' } });
      } catch (e) {
        setAviso(mensajeGrupos(e));
      } finally {
        setCreando(false);
      }
    };
    return (
      <Panel
        titulo="👥 Estudiá en grupo"
        subtitulo="Creá un grupo para esta materia e invitá a tus compañeros con un link. Van a ver un ranking de quién estudió más.">
        <Boton titulo={creando ? 'Creando…' : 'Crear grupo'} variante="claro" onPress={crear} deshabilitado={creando} />
        {aviso && (
          <Texto variante="chico" color="#FFE08A">
            ⚠️ {aviso}
          </Texto>
        )}
      </Panel>
    );
  }

  const invitar = async () => {
    const resultado = await compartirInvitacion(grupo.nombre, linkInvitacion(grupo.codigo));
    setAviso(resultado === 'copiado' ? 'Link copiado. Pegalo donde quieras.' : null);
  };

  return (
    <Panel titulo={`👥 ${grupo.nombre}`} subtitulo="Ranking de esta semana">
      {filas ? (
        <RankingLista filas={filas} limite={3} />
      ) : (
        <Texto variante="chico" color={Colores.blancoSuave}>
          Cargando ranking…
        </Texto>
      )}
      <View style={estilos.fila}>
        <Boton
          titulo="Ver grupo"
          variante="claro"
          style={estilos.mitad}
          onPress={() => router.push({ pathname: '/grupo/[id]', params: { id: grupo.id } })}
        />
        <Boton titulo="Invitar" variante="secundario" style={estilos.mitad} onPress={invitar} />
      </View>
      {aviso && (
        <Texto variante="chico" color={Colores.blancoSuave}>
          {aviso}
        </Texto>
      )}
    </Panel>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
  mitad: {
    flex: 1,
  },
});
