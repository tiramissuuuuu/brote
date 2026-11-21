import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';

/** Recuadro verde oscuro con un título, para listas y secciones. */
export function Panel({ titulo, subtitulo, children }: { titulo?: string; subtitulo?: string; children: ReactNode }) {
  return (
    <View style={estilos.panel}>
      {(titulo || subtitulo) && (
        <View>
          {titulo && (
            <Texto variante="subtitulo" color={Colores.blanco}>
              {titulo}
            </Texto>
          )}
          {subtitulo && (
            <Texto variante="chico" color={Colores.blancoSuave}>
              {subtitulo}
            </Texto>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  panel: {
    backgroundColor: Colores.panel,
    borderRadius: 22,
    padding: Espacio.m,
    gap: Espacio.m - 4,
  },
});
