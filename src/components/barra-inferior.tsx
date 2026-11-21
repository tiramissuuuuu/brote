import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useEstudiar } from '@/hooks/use-estudiar';

export type Seccion = 'jardin' | 'cuenta';

/** Barra de abajo: Jardín, el botón redondo de Estudiar en el medio, y Cuenta. */
export function BarraInferior({ activa: seccionActiva }: { activa: Seccion }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { estudiar, regando: activa } = useEstudiar();

  return (
    <View style={estilos.contenedor} pointerEvents="box-none">
      <View style={[estilos.barra, { paddingBottom: insets.bottom + Espacio.s }]}>
        <Item icono="🏡" etiqueta="Jardín" activo={seccionActiva === 'jardin'} onPress={() => router.replace('/')} />
        <View style={estilos.centro}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={activa ? 'Ver la sesión en curso' : 'Empezar a estudiar'}
            onPress={estudiar}
            style={({ pressed }) => [estilos.central, pressed && { transform: [{ scale: 0.95 }] }]}>
            <Texto style={estilos.iconoCentral}>{activa ? '💧' : '🌱'}</Texto>
          </Pressable>
          <Texto variante="chico" color={Colores.blanco}>
            {activa ? 'Regando' : 'Estudiar'}
          </Texto>
        </View>
        <Item icono="👤" etiqueta="Cuenta" activo={seccionActiva === 'cuenta'} onPress={() => router.replace('/cuenta')} />
      </View>
    </View>
  );
}

function Item({ icono, etiqueta, activo, onPress }: { icono: string; etiqueta: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: activo }}
      onPress={activo ? undefined : onPress}
      style={[estilos.item, activo && estilos.itemActivo]}>
      <Texto style={estilos.icono}>{icono}</Texto>
      <Texto variante="chico" color={activo ? Colores.blanco : Colores.blancoSuave}>
        {etiqueta}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  barra: {
    width: '100%',
    maxWidth: AnchoMaximo,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: Espacio.s + 2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: Colores.barraInferior,
  },
  item: {
    alignItems: 'center',
    minWidth: 76,
    paddingVertical: Espacio.xs + 2,
    borderRadius: 16,
  },
  itemActivo: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  icono: {
    fontSize: 24,
    lineHeight: 30,
  },
  centro: {
    alignItems: 'center',
    marginTop: -34,
  },
  central: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CDEFD9',
    borderWidth: 5,
    borderColor: Colores.barraInferior,
  },
  iconoCentral: {
    fontSize: 32,
    lineHeight: 38,
  },
});
