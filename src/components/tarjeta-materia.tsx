import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgreso } from '@/components/barra-progreso';
import { Planta } from '@/components/planta';
import { Colores, Espacio } from '@/constants/theme';
import { calcularProgreso, formatoHoras, nombreEtapa, type Materia } from '@/lib/brote';

type Props = {
  materia: Materia;
  ms: number;
  activa: boolean;
  ancho: number;
  onPress: () => void;
};

export function TarjetaMateria({ materia, ms, activa, ancho, onPress }: Props) {
  const progreso = calcularProgreso(ms, materia.metaHoras);
  const etapa = nombreEtapa(progreso);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${materia.nombre}: ${etapa}, ${formatoHoras(ms)} de ${materia.metaHoras} horas`}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.tarjeta,
        { width: ancho },
        activa && estilos.activa,
        pressed && estilos.presionada,
      ]}>
      <View style={estilos.planta}>
        <Planta progreso={progreso} color={materia.color} semilla={materia.id} tamano={Math.min(ancho - 24, 170)} />
      </View>
      <Text style={estilos.nombre} numberOfLines={2}>
        {materia.nombre}
      </Text>
      <Text style={[estilos.etapa, activa && estilos.etapaActiva]}>
        {activa ? '💧 Regando ahora' : etapa}
      </Text>
      <BarraProgreso progreso={progreso} color={materia.color} />
      <Text style={estilos.horas}>
        {formatoHoras(ms)} de {materia.metaHoras} h
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  tarjeta: {
    backgroundColor: Colores.tarjeta,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colores.borde,
    padding: Espacio.s + 2,
    gap: Espacio.xs + 2,
  },
  activa: {
    borderColor: Colores.verde,
  },
  presionada: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  planta: {
    alignItems: 'center',
  },
  nombre: {
    color: Colores.texto,
    fontSize: 16,
    fontWeight: '700',
  },
  etapa: {
    color: Colores.textoSuave,
    fontSize: 13,
  },
  etapaActiva: {
    color: Colores.verde,
    fontWeight: '600',
  },
  horas: {
    color: Colores.textoSuave,
    fontSize: 12,
  },
});
