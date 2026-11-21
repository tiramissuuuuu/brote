import { StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Confeti } from '@/components/confeti';
import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';
import { formatoDuracion, SESION_MINIMA_MS } from '@/lib/brote';

type Props = {
  /** Cuánto duró la sesión que se acaba de terminar. */
  ms: number;
  /** Nombre de la especie del árbol, por ejemplo "Butiá". */
  especie: string;
  /** Progreso de la semana después de la sesión, de 0 a 1. */
  progreso: number;
  onCerrar: () => void;
};

const duracion = (ms: number) => (ms < 60_000 ? `${Math.round(ms / 1000)}s` : formatoDuracion(ms));

/** Se muestra al terminar una sesión: cuánto estudiaste, con confeti por toda la pantalla. */
export function Festejo({ ms, especie, progreso, onCerrar }: Props) {
  const guardada = ms >= SESION_MINIMA_MS;

  return (
    <View style={estilos.fondo}>
      <View style={estilos.tarjeta} accessibilityRole="alert">
        <Texto style={estilos.emoji}>{guardada ? '🎉' : '🌱'}</Texto>
        <Texto variante="titulo" style={estilos.centrado}>
          {guardada ? '¡Bien ahí!' : 'Sesión muy cortita'}
        </Texto>
        {guardada ? (
          <>
            <Texto color="#56645A" style={estilos.centrado}>
              En esta sesión estudiaste
            </Texto>
            <Texto variante="enorme">{duracion(ms)}</Texto>
            <Texto variante="chico" color="#56645A" style={estilos.centrado}>
              Tu {especie.toLowerCase()} va {Math.floor(progreso * 100)}% de la meta de la semana
              {progreso >= 1 ? ' 🌸' : ''}
            </Texto>
          </>
        ) : (
          <Texto color="#56645A" style={estilos.centrado}>
            Duró menos de 10 segundos, así que no se guardó.
          </Texto>
        )}
        <Boton titulo="Listo" vibracion="liviana" onPress={onCerrar} style={estilos.boton} />
      </View>
      {guardada && <Confeti />}
    </View>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espacio.l,
    backgroundColor: 'rgba(11,26,38,0.55)',
  },
  tarjeta: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: Espacio.s,
    padding: Espacio.l,
    borderRadius: 28,
    backgroundColor: Colores.blanco,
    borderBottomWidth: 5,
    borderBottomColor: '#D8E3DC',
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  centrado: {
    textAlign: 'center',
  },
  boton: {
    alignSelf: 'stretch',
    marginTop: Espacio.s,
  },
});
