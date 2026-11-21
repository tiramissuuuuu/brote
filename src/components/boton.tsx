import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Colores } from '@/constants/theme';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  deshabilitado?: boolean;
  style?: StyleProp<ViewStyle>;
};

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
      <Text style={[estilos.texto, variante === 'secundario' && estilos.textoSecundario]}>{titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: Colores.verde },
  secundario: { backgroundColor: Colores.verdeClaro },
  peligro: { backgroundColor: Colores.peligro },
  deshabilitado: { opacity: 0.4 },
  presionado: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  texto: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  textoSecundario: { color: Colores.verdeOscuro },
});
