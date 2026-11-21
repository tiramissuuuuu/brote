import { Pressable, StyleSheet, View } from 'react-native';

import { Arbol } from '@/components/arbol';
import { BarraProgreso } from '@/components/barra-progreso';
import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';
import { calcularProgreso, formatoDuracion, type Materia } from '@/lib/brote';
import { ESPECIES } from '@/lib/especies';

type Props = {
  materia: Materia;
  /** Milisegundos estudiados esta semana. */
  ms: number;
  activa: boolean;
  onPress: () => void;
  /** Texto de la derecha; por defecto, las horas de la semana. */
  derecha?: string;
};

export function FilaMateria({ materia, ms, activa, onPress, derecha }: Props) {
  const progreso = calcularProgreso(ms, materia.metaSemanal);
  const especie = ESPECIES[materia.especie].nombre;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${materia.nombre}, ${especie}: ${formatoDuracion(ms)} de ${materia.metaSemanal} horas esta semana`}
      onPress={onPress}
      style={({ pressed }) => [estilos.fila, pressed && { opacity: 0.8 }]}>
      <View style={estilos.icono}>
        <Arbol especie={materia.especie} progreso={progreso} color={materia.color} semilla={materia.id} tamano={44} />
      </View>
      <View style={estilos.datos}>
        <View style={estilos.titulo}>
          <Texto variante="subtitulo" color={Colores.blanco} numberOfLines={1} style={estilos.nombre}>
            {materia.nombre}
          </Texto>
          <Texto variante="subtitulo" color={Colores.blanco}>
            {derecha ?? formatoDuracion(ms)}
          </Texto>
        </View>
        <BarraProgreso progreso={progreso} alto={8} />
        <Texto variante="chico" color={activa ? Colores.amarillo : Colores.blancoSuave}>
          {activa ? '💧 Regando ahora' : `${especie} · meta ${materia.metaSemanal}h por semana`}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
  },
  icono: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  datos: {
    flex: 1,
    gap: 6,
  },
  titulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Espacio.s,
  },
  nombre: {
    flex: 1,
  },
});
