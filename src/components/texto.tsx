import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colores, Fuentes } from '@/constants/theme';

type Variante = 'marca' | 'enorme' | 'titulo' | 'subtitulo' | 'cuerpo' | 'chico' | 'boton';

type Props = TextProps & {
  variante?: Variante;
  color?: string;
};

/** Texto con la tipografía de la app. Por defecto, oscuro; pasá `color` para cambiarlo. */
export function Texto({ variante = 'cuerpo', color = Colores.tinta, style, ...resto }: Props) {
  return <Text style={[estilos[variante], { color }, style]} {...resto} />;
}

const estilos = StyleSheet.create({
  marca: {
    fontFamily: Fuentes.negrita,
    fontSize: 30,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  enorme: {
    fontFamily: Fuentes.negrita,
    fontSize: 72,
    lineHeight: 80,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    // Contorno blanco, como un sticker
    textShadowColor: Colores.blanco,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  titulo: {
    fontFamily: Fuentes.negrita,
    fontSize: 24,
  },
  subtitulo: {
    fontFamily: Fuentes.semi,
    fontSize: 18,
  },
  cuerpo: {
    fontFamily: Fuentes.normal,
    fontSize: 16,
  },
  chico: {
    fontFamily: Fuentes.normal,
    fontSize: 13,
  },
  boton: {
    fontFamily: Fuentes.negrita,
    fontSize: 18,
  },
});
