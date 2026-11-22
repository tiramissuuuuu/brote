import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Encabezado } from '@/components/encabezado';
import { Panel } from '@/components/panel';
import { RankingLista } from '@/components/ranking-lista';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { compartirInvitacion, useMisGrupos, useRanking, type Periodo } from '@/hooks/use-grupos';
import { linkInvitacion, mensajeGrupos, salirGrupo } from '@/lib/grupos';
import { useJardin } from '@/state/jardin';

/** Un grupo de estudio: el ranking (de la semana o total), invitar y salir. */
export default function PantallaGrupo() {
  const { id, nuevo } = useLocalSearchParams<{ id: string; nuevo?: string }>();
  const router = useRouter();
  const { todasLasMaterias } = useJardin();
  const { grupos, cargando } = useMisGrupos();
  const grupo = grupos?.find((g) => g.id === id) ?? null;
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const { filas, error } = useRanking(grupo ? grupo.id : null, periodo);
  const [aviso, setAviso] = useState<string | null>(null);
  const [confirmarSalir, setConfirmarSalir] = useState(false);

  const volver = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (cargando) {
    return (
      <View style={estilos.pantalla}>
        <Encabezado titulo="Grupo" claro />
        <Texto color={Colores.blancoSuave} style={estilos.centrado}>
          Cargando…
        </Texto>
      </View>
    );
  }

  if (!grupo) {
    return (
      <View style={estilos.pantalla}>
        <Encabezado titulo="Grupo" claro />
        <View style={estilos.columnaCentrada}>
          <Texto color={Colores.blanco} style={estilos.centrado}>
            No estás en este grupo (o se borró).
          </Texto>
          <Boton titulo="Volver" variante="claro" onPress={volver} />
        </View>
      </View>
    );
  }

  const link = linkInvitacion(grupo.codigo);
  const miMateria = todasLasMaterias.find((m) => m.id === grupo.materiaId);

  const copiar = async () => {
    await Clipboard.setStringAsync(link);
    setAviso('¡Link copiado! Pegalo en WhatsApp o donde quieras.');
  };

  const compartir = async () => {
    const resultado = await compartirInvitacion(grupo.nombre, link);
    if (resultado === 'copiado') setAviso('Tu dispositivo no puede compartir directo, así que copié el link.');
  };

  const salir = async () => {
    try {
      await salirGrupo(grupo.id);
      volver();
    } catch (e) {
      setAviso(mensajeGrupos(e));
    }
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo={grupo.nombre} claro />
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.columna}>
          {nuevo === '1' && (
            <View style={estilos.sorpresa}>
              <Texto variante="subtitulo" style={estilos.centrado}>
                🎉 ¡Grupo creado!
              </Texto>
              <Texto variante="chico" style={estilos.centrado}>
                Mandales el link de abajo a tus compañeros para que se sumen.
              </Texto>
            </View>
          )}

          <View style={estilos.selector} accessibilityRole="tablist">
            {(['semana', 'total'] as Periodo[]).map((p) => (
              <Pressable
                key={p}
                accessibilityRole="tab"
                accessibilityState={{ selected: periodo === p }}
                onPress={() => setPeriodo(p)}
                style={[estilos.opcion, periodo === p && estilos.opcionActiva]}>
                <Texto variante="subtitulo" color={periodo === p ? Colores.tinta : Colores.blanco}>
                  {p === 'semana' ? 'Esta semana' : 'Total'}
                </Texto>
              </Pressable>
            ))}
          </View>

          <Panel
            titulo="🏆 Ranking"
            subtitulo="Se actualiza solo. Las sesiones cuentan cuando terminan.">
            {filas ? (
              <RankingLista filas={filas} />
            ) : (
              <Texto variante="chico" color={Colores.blancoSuave}>
                Cargando ranking…
              </Texto>
            )}
            {error && (
              <Texto variante="chico" color="#FFE08A">
                ⚠️ {error}
              </Texto>
            )}
          </Panel>

          <Panel titulo="✉️ Invitar" subtitulo="Cualquiera con este link puede sumarse al grupo.">
            <View style={estilos.link}>
              <Texto variante="chico" color={Colores.blanco} selectable numberOfLines={2}>
                {link}
              </Texto>
            </View>
            <View style={estilos.fila}>
              <Boton titulo="Copiar link" variante="claro" vibracion="liviana" style={estilos.mitad} onPress={copiar} />
              <Boton titulo="Compartir" variante="secundario" vibracion="liviana" style={estilos.mitad} onPress={compartir} />
            </View>
            {aviso && (
              <Texto variante="chico" color={Colores.amarillo}>
                {aviso}
              </Texto>
            )}
          </Panel>

          {miMateria && (
            <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
              Tus horas cuentan desde tu materia “{miMateria.nombre}”.
            </Texto>
          )}

          {confirmarSalir ? (
            <Panel titulo="¿Salir del grupo?" subtitulo="Tus horas no se borran; solo dejás de aparecer en el ranking.">
              <View style={estilos.fila}>
                <Boton titulo="Cancelar" variante="secundario" style={estilos.mitad} onPress={() => setConfirmarSalir(false)} />
                <Boton titulo="Sí, salir" variante="peligro" style={estilos.mitad} onPress={salir} />
              </View>
            </Panel>
          ) : (
            <Pressable accessibilityRole="button" style={estilos.salir} onPress={() => setConfirmarSalir(true)}>
              <Texto color="#FFD1D1">Salir del grupo</Texto>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  contenido: {
    padding: Espacio.m,
    paddingBottom: Espacio.xl * 2,
    alignItems: 'center',
  },
  columna: {
    width: '100%',
    maxWidth: AnchoMaximo - Espacio.m * 2,
    gap: Espacio.m,
  },
  columnaCentrada: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    gap: Espacio.m,
    padding: Espacio.l,
  },
  centrado: {
    textAlign: 'center',
  },
  sorpresa: {
    gap: Espacio.xs,
    padding: Espacio.m,
    borderRadius: 18,
    backgroundColor: Colores.amarillo,
  },
  selector: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 18,
    backgroundColor: Colores.pastoOscuro,
  },
  opcion: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Espacio.s + 2,
    borderRadius: 14,
  },
  opcionActiva: {
    backgroundColor: Colores.amarillo,
  },
  link: {
    padding: Espacio.m - 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  fila: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
  mitad: {
    flex: 1,
  },
  salir: {
    alignSelf: 'center',
    padding: Espacio.s,
  },
});
