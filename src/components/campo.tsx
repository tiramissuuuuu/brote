import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Texto } from '@/components/texto';
import { Colores, Espacio, Fuentes } from '@/constants/theme';

type Props = TextInputProps & {
  etiqueta: string;
  ayuda?: string;
};

/** Campo de formulario: etiqueta, cuadro de texto blanco y una ayuda opcional. */
export function Campo({ etiqueta, ayuda, style, ...resto }: Props) {
  return (
    <View style={estilos.campo}>
      <Texto variante="subtitulo" color={Colores.blanco}>
        {etiqueta}
      </Texto>
      <TextInput
        placeholderTextColor="#8A9A8F"
        accessibilityLabel={etiqueta}
        style={[estilos.entrada, style]}
        {...resto}
      />
      {ayuda && (
        <Texto variante="chico" color={Colores.blancoSuave} style={estilos.ayuda}>
          {ayuda}
        </Texto>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  campo: {
    gap: Espacio.s,
  },
  entrada: {
    backgroundColor: Colores.blanco,
    borderRadius: 16,
    paddingHorizontal: Espacio.m,
    paddingVertical: 14,
    fontSize: 17,
    fontFamily: Fuentes.normal,
    color: Colores.tinta,
    borderBottomWidth: 3,
    borderBottomColor: '#D8E3DC',
  },
  ayuda: {
    lineHeight: 18,
  },
});
