import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Texto } from '@/components/texto';
import { Colores } from '@/constants/theme';

type Variante = 'primario' | 'secundario' | 'peligro' | 'claro';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
};

const COLOR_TEXTO: Record<Variante, string> = {
  primario: Colores.tinta,
  secundario: Colores.blanco,
  peligro: Colores.blanco,
  claro: Colores.tinta,
};

/** Botón "gordito" de dibujito: tiene un borde de abajo más oscuro que le da volumen. */
export function Boton({ titulo, onPress, variante = 'primario', deshabilitado = false, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        estilos[variante],
        deshabilitado && estilos.deshabilitado,
        pressed && estilos.presionado,
        style,
      ]}>
      <Texto variante="boton" color={COLOR_TEXTO[variante]}>
        {titulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
  },
  primario: { backgroundColor: Colores.amarillo, borderBottomColor: Colores.amarilloOscuro },
  secundario: { backgroundColor: 'rgba(255,255,255,0.18)', borderBottomColor: 'rgba(0,0,0,0.12)' },
  peligro: { backgroundColor: Colores.peligro, borderBottomColor: Colores.peligroOscuro },
  claro: { backgroundColor: Colores.blanco, borderBottomColor: '#D8E3DC' },
  deshabilitado: { opacity: 0.45 },
  presionado: { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
});
