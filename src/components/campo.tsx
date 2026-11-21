import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Texto } from '@/components/texto';
import { Colores, Espacio, Fuentes } from '@/constants/theme';

type Props = TextInputProps & {
  etiqueta: string;
  ayuda?: string;
  /** Aviso en rojo debajo del campo (reemplaza la ayuda). */
  error?: string | null;
};

/** Campo de formulario: etiqueta, cuadro de texto blanco y una ayuda opcional. */
export function Campo({ etiqueta, ayuda, error, style, ...resto }: Props) {
  return (
    <View style={estilos.campo}>
      <Texto variante="subtitulo" color={Colores.blanco}>
        {etiqueta}
      </Texto>
      <TextInput
        placeholderTextColor="#8A9A8F"
        accessibilityLabel={etiqueta}
        style={[estilos.entrada, error ? estilos.entradaError : null, style]}
        {...resto}
      />
      {error ? (
        <Texto variante="chico" color="#FFE08A" style={estilos.ayuda} accessibilityRole="alert">
          ⚠️ {error}
        </Texto>
      ) : (
        ayuda && (
          <Texto variante="chico" color={Colores.blancoSuave} style={estilos.ayuda}>
            {ayuda}
          </Texto>
        )
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
  entradaError: {
    borderBottomColor: Colores.peligro,
  },
  ayuda: {
    lineHeight: 18,
  },
});
