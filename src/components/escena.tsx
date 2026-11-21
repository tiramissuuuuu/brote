import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { Colores } from '@/constants/theme';

// El dibujo de fondo mide 400 × 300 y se escala para cubrir la escena, alineado abajo.
const ANCHO_DIBUJO = 400;
const ALTO_DIBUJO = 300;
/** Altura (en el dibujo) de la cima de la colina de adelante, donde se apoyan los árboles. */
const CIMA_COLINA = 214;

type Props = {
  ancho: number;
  alto: number;
  /** Lo que va parado sobre la colina (los árboles). */
  children?: ReactNode;
};

/** A cuántos píxeles del borde de abajo de la escena se apoyan los árboles. */
export function alturaSuelo(ancho: number, alto: number): number {
  const escala = Math.max(ancho / ANCHO_DIBUJO, alto / ALTO_DIBUJO);
  return Math.max(0, (ALTO_DIBUJO - CIMA_COLINA) * escala - 14);
}

/** Cielo con nubes, colinas y árboles de fondo. */
export function Escena({ ancho, alto, children }: Props) {
  const suelo = alturaSuelo(ancho, alto);
  // El dibujo se agranda hasta cubrir toda la escena, centrado y apoyado abajo (se recortan los costados o el cielo).
  const escala = Math.max(ancho / ANCHO_DIBUJO, alto / ALTO_DIBUJO);
  const anchoDibujo = ANCHO_DIBUJO * escala;
  const altoDibujo = ALTO_DIBUJO * escala;

  return (
    <View style={[estilos.escena, { height: alto }]}>
      <Svg
        width={anchoDibujo}
        height={altoDibujo}
        style={[estilos.dibujo, { left: (ancho - anchoDibujo) / 2 }]}
        viewBox={`0 0 ${ANCHO_DIBUJO} ${ALTO_DIBUJO}`}>
        <Nube x={60} y={70} s={1} />
        <Nube x={250} y={46} s={1.3} />
        <Nube x={330} y={110} s={0.7} />
        <Path d="M0 190 Q100 150 200 176 T400 166 V300 H0 Z" fill={Colores.colinaLejos} />
        <ArbolDeFondo x={34} y={182} s={1.1} />
        <ArbolDeFondo x={78} y={174} s={0.8} />
        <ArbolDeFondo x={330} y={170} s={1.2} />
        <ArbolDeFondo x={376} y={176} s={0.9} />
        <Path d="M0 236 Q200 194 400 236 V300 H0 Z" fill={Colores.pasto} />
        <Arbusto x={40} y={244} />
        <Arbusto x={350} y={240} />
      </Svg>
      <View style={[estilos.suelo, { bottom: suelo }]}>{children}</View>
    </View>
  );
}

function Nube({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G fill={Colores.nube}>
      <Circle cx={x} cy={y} r={16 * s} />
      <Circle cx={x + 20 * s} cy={y - 9 * s} r={21 * s} />
      <Circle cx={x + 42 * s} cy={y} r={15 * s} />
      <Rect x={x} y={y - 2 * s} width={42 * s} height={17 * s} />
    </G>
  );
}

/** Los árboles de dibujito del fondo, con la rayita ondulada. */
function ArbolDeFondo({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <G transform={`translate(${x}, ${y}) scale(${s})`}>
      <Rect x={-3} y={-12} width={6} height={12} fill="#6B4A2F" />
      <Path d="M0 -66 C22 -66 26 -32 18 -16 C12 -7 -12 -7 -18 -16 C-26 -32 -22 -66 0 -66 Z" fill={Colores.arbolFondo} />
      <Path d="M0 -66 C-22 -66 -26 -32 -18 -16 C-12 -9 -5 -9 0 -10 Z" fill={Colores.arbolFondoLuz} />
      <Path
        d="M-9 -44 Q-6 -47 -3 -44 Q0 -41 3 -44 M2 -30 Q5 -33 8 -30 Q11 -27 14 -30"
        stroke={Colores.arbolFondo}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

function Arbusto({ x, y }: { x: number; y: number }) {
  return (
    <G fill={Colores.pastoOscuro}>
      <Circle cx={x} cy={y} r={9} />
      <Circle cx={x + 11} cy={y - 4} r={11} />
      <Circle cx={x + 22} cy={y} r={8} />
    </G>
  );
}

const estilos = StyleSheet.create({
  escena: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: Colores.cielo,
  },
  dibujo: {
    position: 'absolute',
    // 1 px de más hacia abajo para que no quede una línea entre la escena y el pasto de la pantalla.
    bottom: -1,
  },
  suelo: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
