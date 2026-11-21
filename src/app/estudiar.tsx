import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Encabezado } from '@/components/encabezado';
import { FilaMateria } from '@/components/fila-materia';
import { Panel } from '@/components/panel';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useAhora } from '@/hooks/use-ahora';
import { msEstaSemana } from '@/lib/brote';
import { useJardin } from '@/state/jardin';

/** Se abre con el botón redondo del medio: elegís la materia y arranca el cronómetro. */
export default function Estudiar() {
  const router = useRouter();
  const { materias, sesiones, activa, empezar } = useJardin();
  const ahora = useAhora(activa !== null);

  const elegir = (id: string) => {
    empezar(id);
    router.replace({ pathname: '/materia/[id]', params: { id } });
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="¿Qué vas a estudiar?" icono="✕" claro />
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={estilos.columna}>
          <Panel subtitulo="Tocá una materia y arranca el cronómetro">
            {materias.map((m) => (
              <FilaMateria
                key={m.id}
                materia={m}
                ms={msEstaSemana(m.id, sesiones, activa, ahora)}
                activa={activa?.materiaId === m.id}
                onPress={() => elegir(m.id)}
                derecha="▶"
              />
            ))}
          </Panel>
          <Boton titulo="+ Plantar otra materia" variante="secundario" onPress={() => router.replace('/nueva')} />
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  contenido: {
    padding: Espacio.m,
    paddingBottom: Espacio.xl * 2,
    alignItems: 'center',
  },
  columna: {
    width: '100%',
    maxWidth: AnchoMaximo - Espacio.m * 2,
    gap: Espacio.m,
  },
});
