import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarraInferior, type Seccion } from '@/components/barra-inferior';
import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';
import { ANCHO_LATERAL, useDisposicion } from '@/hooks/use-disposicion';
import { useEstudiar } from '@/hooks/use-estudiar';

/**
 * Envuelve las pantallas principales (Jardín y Cuenta) con la navegación que corresponde:
 * en el celular, la barra de abajo; en la computadora, una barra lateral a la izquierda.
 */
export function Marco({ seccion, children }: { seccion: Seccion; children: ReactNode }) {
  const { escritorio } = useDisposicion();

  if (!escritorio) {
    return (
      <View style={estilos.pantalla}>
        {children}
        <BarraInferior activa={seccion} />
      </View>
    );
  }

  return (
    <View style={[estilos.pantalla, estilos.fila]}>
      <BarraLateral seccion={seccion} />
      <View style={estilos.contenido}>{children}</View>
    </View>
  );
}

function BarraLateral({ seccion }: { seccion: Seccion }) {
  const router = useRouter();
  const { estudiar, regando } = useEstudiar();

  return (
    <View style={estilos.lateral}>
      <Texto variante="marca" color={Colores.blanco} style={estilos.marca}>
        🌱 Brote
      </Texto>

      <Pressable
        accessibilityRole="button"
        onPress={estudiar}
        style={({ pressed }) => [estilos.estudiar, pressed && { transform: [{ translateY: 2 }] }]}>
        <Texto variante="boton">{regando ? '💧 Regando…' : '🌱 Estudiar'}</Texto>
      </Pressable>

      <View style={estilos.items}>
        <Item icono="🏡" etiqueta="Jardín" activo={seccion === 'jardin'} onPress={() => router.replace('/')} />
        <Item icono="👤" etiqueta="Cuenta" activo={seccion === 'cuenta'} onPress={() => router.replace('/cuenta')} />
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
      style={({ hovered }) => [estilos.item, (activo || hovered) && estilos.itemActivo]}>
      <Texto style={estilos.icono}>{icono}</Texto>
      <Texto variante="subtitulo" color={activo ? Colores.blanco : Colores.blancoSuave}>
        {etiqueta}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  fila: {
    flexDirection: 'row',
  },
  contenido: {
    flex: 1,
  },
  lateral: {
    width: ANCHO_LATERAL,
    paddingVertical: Espacio.l,
    paddingHorizontal: Espacio.m,
    gap: Espacio.l,
    backgroundColor: Colores.barraInferior,
  },
  marca: {
    paddingHorizontal: Espacio.s,
  },
  estudiar: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: Colores.amarillo,
    borderBottomWidth: 4,
    borderBottomColor: Colores.amarilloOscuro,
  },
  items: {
    gap: Espacio.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
    paddingVertical: Espacio.s + 2,
    paddingHorizontal: Espacio.m - 4,
    borderRadius: 14,
  },
  itemActivo: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  icono: {
    fontSize: 22,
    lineHeight: 28,
  },
});
