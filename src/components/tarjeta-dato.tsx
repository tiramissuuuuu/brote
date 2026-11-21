import { StyleSheet, View } from 'react-native';

import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';

type Props = {
  icono: string;
  valor: string;
  etiqueta: string;
};

/** Cuadrito con un ícono, un valor grande y una etiqueta (como "2h 24m · Esta semana"). */
export function TarjetaDato({ icono, valor, etiqueta }: Props) {
  return (
    <View style={estilos.tarjeta} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
      <Texto style={estilos.icono}>{icono}</Texto>
      <Texto variante="subtitulo" color={Colores.blanco} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Texto>
      <Texto variante="chico" color={Colores.blancoSuave} numberOfLines={2} style={estilos.etiqueta}>
        {etiqueta}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Espacio.m - 2,
    paddingHorizontal: Espacio.s,
    borderRadius: 18,
    backgroundColor: Colores.pastoOscuro,
  },
  icono: {
    fontSize: 26,
    lineHeight: 32,
  },
  etiqueta: {
    textAlign: 'center',
  },
});
