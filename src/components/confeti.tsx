import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORES = ['#FFC83D', '#E63946', '#9B5DE5', '#4CC9F0', '#F15BB5', '#6DBE45', '#FFFFFF'];
const CANTIDAD = 90;

type Pieza = {
  x: number;
  tamano: number;
  color: string;
  demora: number;
  duracion: number;
  /** Cuántos grados gira mientras cae. */
  giro: number;
  /** Cuánto se balancea de costado. */
  vaiven: number;
  redonda: boolean;
};

function crearPiezas(ancho: number): Pieza[] {
  return Array.from({ length: CANTIDAD }, () => ({
    x: Math.random() * ancho,
    tamano: 7 + Math.random() * 7,
    color: COLORES[Math.floor(Math.random() * COLORES.length)],
    demora: Math.random() * 700,
    duracion: 2200 + Math.random() * 1600,
    giro: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
    vaiven: 10 + Math.random() * 25,
    redonda: Math.random() < 0.25,
  }));
}

/** Lluvia de confeti por toda la pantalla. No bloquea los toques. */
export function Confeti() {
  const { width, height } = useWindowDimensions();
  const [piezas] = useState(() => crearPiezas(width));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {piezas.map((pieza, i) => (
        <PiezaDeConfeti key={i} pieza={pieza} alto={height} />
      ))}
    </View>
  );
}

function PiezaDeConfeti({ pieza, alto }: { pieza: Pieza; alto: number }) {
  // Va de 0 (arriba, antes de entrar) a 1 (abajo, después de salir).
  const avance = useSharedValue(0);

  useEffect(() => {
    avance.set(withDelay(pieza.demora, withTiming(1, { duration: pieza.duracion, easing: Easing.linear })));
  }, [avance, pieza]);

  const estilo = useAnimatedStyle(() => {
    const t = avance.get();
    return {
      opacity: t < 0.85 ? 1 : (1 - t) / 0.15,
      transform: [
        { translateX: pieza.x + Math.sin(t * Math.PI * 4) * pieza.vaiven },
        { translateY: -30 + t * (alto + 60) },
        { rotate: `${t * pieza.giro}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        estilos.pieza,
        {
          width: pieza.tamano,
          height: pieza.redonda ? pieza.tamano : pieza.tamano * 0.45,
          borderRadius: pieza.redonda ? pieza.tamano / 2 : 2,
          backgroundColor: pieza.color,
        },
        estilo,
      ]}
    />
  );
}

const estilos = StyleSheet.create({
  pieza: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
