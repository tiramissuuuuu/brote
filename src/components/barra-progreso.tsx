import { StyleSheet, View, type DimensionValue } from 'react-native';

import { Colores } from '@/constants/theme';

type Props = {
  progreso: number;
  /** Color del relleno (amarillo por defecto). */
  color?: string;
  /** Alto en píxeles. */
  alto?: number;
};

export function BarraProgreso({ progreso, color = Colores.amarillo, alto = 14 }: Props) {
  const ancho = `${Math.round(Math.max(0, Math.min(1, progreso)) * 100)}%` as DimensionValue;
  return (
    <View style={[estilos.pista, { height: alto, borderRadius: alto / 2 }]}>
      <View style={[estilos.relleno, { width: ancho, backgroundColor: color, borderRadius: alto / 2 }]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pista: {
    backgroundColor: Colores.pista,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  relleno: {
    height: '100%',
  },
});
