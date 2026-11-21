import { StyleSheet, View, type DimensionValue } from 'react-native';

import { Colores } from '@/constants/theme';

export function BarraProgreso({ progreso, color }: { progreso: number; color: string }) {
  const ancho = `${Math.round(Math.max(0, Math.min(1, progreso)) * 100)}%` as DimensionValue;
  return (
    <View style={estilos.fondo}>
      <View style={[estilos.relleno, { width: ancho, backgroundColor: color }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colores.borde,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  relleno: {
    height: '100%',
    borderRadius: 3,
  },
});
