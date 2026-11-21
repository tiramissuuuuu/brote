import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Boton } from '@/components/boton';
import { Planta } from '@/components/planta';
import { TarjetaMateria } from '@/components/tarjeta-materia';
import { AnchoMaximo, Colores, ColoresFlor, Espacio } from '@/constants/theme';
import { useAhora } from '@/hooks/use-ahora';
import { formatoHoras, formatoReloj, formatoSemana, inicioSemana, msEstaSemana } from '@/lib/brote';
import { useJardin } from '@/state/jardin';

const SEPARACION = 12;

export default function Jardin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { materias, sesiones, activa } = useJardin();
  const ahora = useAhora(activa !== null);

  // Se mide el ancho real de la grilla: en web la barra de scroll le quita espacio a la ventana.
  const [anchoGrilla, setAnchoGrilla] = useState<number | null>(null);
  const anchoUtil = anchoGrilla ?? Math.min(width, AnchoMaximo) - Espacio.m * 2;
  const columnas = anchoUtil >= 560 ? 3 : 2;
  const anchoTarjeta = Math.floor((anchoUtil - SEPARACION * (columnas - 1)) / columnas);

  const materiaActiva = activa ? materias.find((m) => m.id === activa.materiaId) : undefined;
  const totalSemanaMs = materias.reduce((suma, m) => suma + msEstaSemana(m.id, sesiones, activa, ahora), 0);

  const abrirMateria = (id: string) => router.push({ pathname: '/materia/[id]', params: { id } });

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={[
        estilos.contenido,
        { paddingTop: insets.top + Espacio.l, paddingBottom: insets.bottom + Espacio.xl },
      ]}>
      <View style={estilos.columna}>
        <View>
          <Text style={estilos.marca}>🌱 brote</Text>
          <Text style={estilos.titulo}>Tu jardín</Text>
          <Text style={estilos.subtitulo}>
            {materias.length === 0
              ? 'Cada materia es una planta. Cuanto más estudiás, más crece.'
              : `Semana del ${formatoSemana(inicioSemana(ahora))} · ${formatoHoras(totalSemanaMs)} de estudio`}
          </Text>
        </View>

        {activa && materiaActiva && (
          <Pressable
            accessibilityRole="button"
            onPress={() => abrirMateria(materiaActiva.id)}
            style={({ pressed }) => [estilos.banner, pressed && { opacity: 0.85 }]}>
            <Text style={estilos.bannerTexto} numberOfLines={1}>
              💧 Regando <Text style={estilos.negrita}>{materiaActiva.nombre}</Text>
            </Text>
            <Text style={estilos.bannerReloj}>{formatoReloj(ahora - activa.inicio)}</Text>
          </Pressable>
        )}

        {materias.length === 0 ? (
          <View style={estilos.vacio}>
            <Planta progreso={0} color={ColoresFlor[0]} semilla="vacio" tamano={140} />
            <Text style={estilos.vacioTexto}>
              Todavía no plantaste nada. Agregá la primera materia del semestre.
            </Text>
          </View>
        ) : (
          <View style={estilos.grilla} onLayout={(e) => setAnchoGrilla(e.nativeEvent.layout.width)}>
            {materias.map((m) => (
              <TarjetaMateria
                key={m.id}
                materia={m}
                ms={msEstaSemana(m.id, sesiones, activa, ahora)}
                activa={activa?.materiaId === m.id}
                ancho={anchoTarjeta}
                onPress={() => abrirMateria(m.id)}
              />
            ))}
          </View>
        )}

        <Boton titulo="+ Nueva materia" onPress={() => router.push('/nueva')} />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
  },
  contenido: {
    paddingHorizontal: Espacio.m,
    alignItems: 'center',
  },
  columna: {
    width: '100%',
    maxWidth: AnchoMaximo - Espacio.m * 2,
    gap: Espacio.l,
  },
  marca: {
    color: Colores.verde,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Espacio.xs,
  },
  titulo: {
    color: Colores.texto,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitulo: {
    color: Colores.textoSuave,
    fontSize: 15,
    marginTop: Espacio.xs,
  },
  banner: {
    backgroundColor: Colores.verde,
    borderRadius: 16,
    paddingVertical: Espacio.m - 2,
    paddingHorizontal: Espacio.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.s,
  },
  bannerTexto: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  negrita: {
    fontWeight: '700',
  },
  bannerReloj: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SEPARACION,
  },
  vacio: {
    alignItems: 'center',
    gap: Espacio.m,
    paddingVertical: Espacio.l,
  },
  vacioTexto: {
    color: Colores.textoSuave,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
  },
});
