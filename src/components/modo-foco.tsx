import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arbol, PROPORCION_ARBOL } from '@/components/arbol';
import { Boton } from '@/components/boton';
import { alturaSuelo, Escena } from '@/components/escena';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { formatoReloj, type Materia } from '@/lib/brote';
import { ESPECIES } from '@/lib/especies';

type Props = {
  materia: Materia;
  /** Cuándo empezó la sesión en curso. */
  inicio: number;
  ahora: number;
  /** Progreso de la semana (contando la sesión en curso), de 0 a 1. */
  progreso: number;
  onTerminar: () => void;
};

/** Pantalla mientras estudiás: el árbol, el cronómetro y terminar. Nada más, para no distraerse. */
export function ModoFoco({ materia, inicio, ahora, progreso, onTerminar }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [confirmando, setConfirmando] = useState(false);

  const ancho = Math.min(width, AnchoMaximo);
  const especie = ESPECIES[materia.especie].nombre;
  // El fondo de siempre (sin agrandarlo): arriba se extiende el cielo y abajo queda pasto para el botón.
  const altoDibujo = Math.min(height * 0.6, 440);
  const pastoAbajo = insets.bottom + 110;
  // El árbol ocupa el espacio entre el cronómetro (arriba) y el piso de la colina.
  const espacioArbol = height - alturaSuelo(ancho, height, altoDibujo, pastoAbajo) - (insets.top + 250);
  const tamanoArbol = Math.max(80, Math.min(ancho * 0.62, espacioArbol / PROPORCION_ARBOL));

  return (
    <View style={estilos.pantalla}>
      <StatusBar style="light" />
      <View style={[estilos.columna, { width: ancho, height }]}>
        <Escena ancho={ancho} alto={height} altoDibujo={altoDibujo} pastoAbajo={pastoAbajo} oscuro>
          <Arbol
            especie={materia.especie}
            progreso={progreso}
            color={materia.color}
            semilla={materia.id}
            tamano={tamanoArbol}
          />
        </Escena>

        <View style={[estilos.arriba, { top: insets.top + Espacio.xl + Espacio.m }]}>
          <Texto variante="subtitulo" color={Colores.blancoSuave} numberOfLines={1}>
            {materia.nombre}
          </Texto>
          <Texto variante="enorme" color={Colores.blanco} style={estilos.reloj}>
            {formatoReloj(ahora - inicio)}
          </Texto>
          <Texto variante="chico" color={Colores.blancoSuave}>
            Regando tu {especie.toLowerCase()} · {Math.floor(progreso * 100)}% de la meta
          </Texto>
        </View>

        <View style={[estilos.abajo, { bottom: insets.bottom + Espacio.l }]}>
          {confirmando ? (
            <View style={estilos.confirmar}>
              <Texto variante="subtitulo" color={Colores.blanco} style={estilos.centrado}>
                ¿Terminar la sesión?
              </Texto>
              <View style={estilos.fila}>
                <Boton
                  titulo="Seguir"
                  variante="secundario"
                  vibracion="liviana"
                  style={estilos.mitad}
                  onPress={() => setConfirmando(false)}
                />
                <Boton
                  titulo="Sí, terminar"
                  variante="peligro"
                  vibracion="media"
                  style={estilos.mitad}
                  onPress={onTerminar}
                />
              </View>
            </View>
          ) : (
            <Boton
              titulo="Terminar sesión"
              variante="peligro"
              vibracion="media"
              onPress={() => setConfirmando(true)}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#13261C',
  },
  columna: {
    overflow: 'hidden',
  },
  arriba: {
    position: 'absolute',
    left: Espacio.m,
    right: Espacio.m,
    alignItems: 'center',
    gap: Espacio.xs,
  },
  reloj: {
    textShadowColor: 'rgba(0,0,0,0.35)',
  },
  abajo: {
    position: 'absolute',
    left: Espacio.m,
    right: Espacio.m,
  },
  confirmar: {
    gap: Espacio.m - 4,
    padding: Espacio.m,
    borderRadius: 22,
    backgroundColor: 'rgba(11,26,38,0.6)',
  },
  centrado: {
    textAlign: 'center',
  },
  fila: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
  mitad: {
    flex: 1,
  },
});
