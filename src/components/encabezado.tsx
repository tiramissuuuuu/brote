import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';

type Props = {
  titulo: string;
  /** Texto claro (para fondos verdes) en vez de oscuro (para el cielo). */
  claro?: boolean;
  /** "←" para volver, "✕" para cerrar un modal. */
  icono?: '←' | '✕';
  derecha?: ReactNode;
};

export function Encabezado({ titulo, claro = false, icono = '←', derecha }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const volver = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={[estilos.fila, { paddingTop: insets.top + Espacio.s }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={icono === '←' ? 'Volver' : 'Cerrar'}
        hitSlop={8}
        onPress={volver}
        style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.7 }]}>
        <Texto variante="titulo" style={estilos.icono}>
          {icono}
        </Texto>
      </Pressable>
      <Texto variante="titulo" color={claro ? Colores.blanco : Colores.tinta} numberOfLines={1} style={estilos.titulo}>
        {titulo}
      </Texto>
      {derecha}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
    paddingHorizontal: Espacio.m,
    paddingBottom: Espacio.s,
  },
  boton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  icono: {
    fontSize: 20,
    lineHeight: 24,
  },
  titulo: {
    flex: 1,
  },
});
