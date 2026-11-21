import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { Colores } from '@/constants/theme';

// El dibujo de fondo mide 400 × 300 (más ancho en pantallas anchas) y va apoyado abajo.
const ANCHO_DIBUJO = 400;
const ALTO_DIBUJO = 300;
/** Altura (en el dibujo) de la cima de la colina de adelante, donde se apoyan los árboles. */
const CIMA_COLINA = 214;
/** Altura (en el dibujo) de la colina del fondo, en el centro. */
const CIMA_COLINA_LEJANA = 178;

type Props = {
  ancho: number;
  alto: number;
  /** Oscurece todo el fondo (no los árboles de adelante), para el modo foco. */
  oscuro?: boolean;
  /**
   * Alto de la parte dibujada (nubes, colinas y árboles de fondo), apoyada abajo. Si la escena es más
   * alta, arriba sigue el cielo liso en vez de agrandar el dibujo. Por defecto, toda la escena.
   */
  altoDibujo?: number;
  /** Pasto liso debajo del dibujo, en píxeles (por ejemplo, para poner botones). */
  pastoAbajo?: number;
  /** Lo que va parado sobre la colina (los árboles). */
  children?: ReactNode;
};

/**
 * Ancho (en unidades del dibujo) de lo que se ve. En pantallas anchas el dibujo se hace más ancho
 * (las colinas se estiran y las nubes y árboles de fondo se repiten) en vez de agrandarse.
 */
function anchoVista(ancho: number, altoDibujo: number): number {
  return Math.max(ANCHO_DIBUJO, (ALTO_DIBUJO * ancho) / Math.max(1, altoDibujo));
}

/** A cuántos píxeles del borde de abajo de la escena se apoyan los árboles. */
export function alturaSuelo(ancho: number, alto: number, altoDibujo = alto, pastoAbajo = 0): number {
  const escala = ancho / anchoVista(ancho, altoDibujo);
  return pastoAbajo + Math.max(0, (ALTO_DIBUJO - CIMA_COLINA) * escala - 14);
}

/** Cuántos píxeles más arriba que la colina de adelante está la colina del fondo (para una segunda fila de árboles). */
export function alturaColinaLejana(ancho: number, alto: number, altoDibujo = alto): number {
  const escala = ancho / anchoVista(ancho, altoDibujo);
  return (CIMA_COLINA - CIMA_COLINA_LEJANA) * escala;
}

/** Cielo con nubes, colinas y árboles de fondo. */
export function Escena({ ancho, alto, oscuro = false, altoDibujo = alto, pastoAbajo = 0, children }: Props) {
  const suelo = alturaSuelo(ancho, alto, altoDibujo, pastoAbajo);
  const w = anchoVista(ancho, altoDibujo);
  const escala = ancho / w;
  // Las nubes, árboles de fondo y arbustos vienen en "baldosas" de 400 de ancho, centradas y repetidas.
  const centro = (w - ANCHO_DIBUJO) / 2;
  const baldosas: number[] = [];
  for (let x = centro - ANCHO_DIBUJO * Math.ceil(centro / ANCHO_DIBUJO); x < w; x += ANCHO_DIBUJO) {
    baldosas.push(x);
  }

  return (
    <View style={[estilos.escena, { height: alto }]}>
      <Svg
        width={ancho}
        height={ALTO_DIBUJO * escala}
        style={[estilos.dibujo, { left: 0, bottom: pastoAbajo - 1 }]}
        viewBox={`0 0 ${w} ${ALTO_DIBUJO}`}>
        {baldosas.map((x) => (
          <G key={`n${x}`} transform={`translate(${x}, 0)`}>
            <Nube x={60} y={70} s={1} />
            <Nube x={250} y={46} s={1.3} />
            <Nube x={330} y={110} s={0.7} />
          </G>
        ))}
        <Path d={`M0 190 Q${w * 0.25} 150 ${w * 0.5} 176 T${w} 166 V300 H0 Z`} fill={Colores.colinaLejos} />
        {baldosas.map((x) => (
          <G key={`a${x}`} transform={`translate(${x}, 0)`}>
            <ArbolDeFondo x={34} y={182} s={1.1} />
            <ArbolDeFondo x={78} y={174} s={0.8} />
            <ArbolDeFondo x={330} y={170} s={1.2} />
            <ArbolDeFondo x={376} y={176} s={0.9} />
          </G>
        ))}
        <Path d={`M0 236 Q${w / 2} 194 ${w} 236 V300 H0 Z`} fill={Colores.pasto} />
        {baldosas.map((x) => (
          <G key={`b${x}`} transform={`translate(${x}, 0)`}>
            <Arbusto x={40} y={244} />
            <Arbusto x={350} y={240} />
          </G>
        ))}
      </Svg>
      {pastoAbajo > 0 && <View style={[estilos.pasto, { height: pastoAbajo }]} />}
      {oscuro && <View style={estilos.velo} />}
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
  // El dibujo va 1 px más abajo para que no quede una línea entre la escena y el pasto.
  dibujo: {
    position: 'absolute',
  },
  pasto: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colores.pasto,
  },
  velo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,26,38,0.55)',
  },
  suelo: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
