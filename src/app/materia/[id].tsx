import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';
import { Planta } from '@/components/planta';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useAhora } from '@/hooks/use-ahora';
import {
  calcularProgreso,
  formatoFecha,
  formatoHoras,
  formatoReloj,
  formatoSemana,
  historialSemanal,
  nombreEtapa,
} from '@/lib/brote';
import { useJardin } from '@/state/jardin';

const ATAJOS = [
  { etiqueta: '+15 min', minutos: 15 },
  { etiqueta: '+30 min', minutos: 30 },
  { etiqueta: '+1 h', minutos: 60 },
];

const SESIONES_VISIBLES = 20;

function nombreSemana(indice: number, inicio: number): string {
  if (indice === 0) return 'Esta semana';
  if (indice === 1) return 'Semana pasada';
  return formatoSemana(inicio);
}

export default function PantallaMateria() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const jardin = useJardin();
  const ahora = useAhora(jardin.activa !== null);
  const [sesionABorrar, setSesionABorrar] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const volverAlJardin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const materia = jardin.materias.find((m) => m.id === id);

  if (!materia) {
    return (
      <View style={estilos.noEncontrada}>
        <Stack.Screen options={{ title: 'Materia' }} />
        <Text style={estilos.texto}>No encontramos esta materia.</Text>
        <Boton titulo="Volver al jardín" variante="secundario" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const { activa } = jardin;
  const estaActiva = activa?.materiaId === materia.id;
  const otraActiva = activa && !estaActiva ? jardin.materias.find((m) => m.id === activa.materiaId) : undefined;

  const semanas = historialSemanal(materia, jardin.sesiones, activa, ahora);
  const msSemana = semanas[0].ms;
  const progreso = calcularProgreso(msSemana, materia.metaSemanal);
  const semanasCumplidas = semanas.filter((s) => calcularProgreso(s.ms, materia.metaSemanal) >= 1).length;

  const sesiones = jardin.sesiones
    .filter((s) => s.materiaId === materia.id)
    .sort((a, b) => b.inicio - a.inicio);
  const tamanoPlanta = Math.min(width - Espacio.m * 2, 260);

  const tocarBorrarSesion = (sesionId: string) => {
    if (sesionABorrar === sesionId) {
      jardin.borrarSesion(sesionId);
      setSesionABorrar(null);
    } else {
      setSesionABorrar(sesionId);
    }
  };

  const eliminar = () => {
    volverAlJardin();
    jardin.eliminarMateria(materia.id);
  };

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={estilos.contenido}>
      <Stack.Screen options={{ title: materia.nombre }} />
      <View style={estilos.columna}>
        <View style={estilos.escena}>
          <Planta progreso={progreso} color={materia.color} semilla={materia.id} tamano={tamanoPlanta} />
          <Text style={estilos.etapa}>{nombreEtapa(progreso)}</Text>
          <Text style={estilos.textoSuave}>
            {formatoHoras(msSemana)} de {materia.metaSemanal} h esta semana · {Math.floor(progreso * 100)}%
          </Text>
          <View style={estilos.barra}>
            <BarraProgreso progreso={progreso} color={materia.color} />
          </View>
        </View>

        <View style={estilos.tarjeta}>
          {estaActiva && activa ? (
            <>
              <Text style={estilos.etiqueta}>💧 Regando tu planta</Text>
              <Text style={estilos.reloj}>{formatoReloj(ahora - activa.inicio)}</Text>
              <Boton titulo="Terminar sesión" variante="peligro" onPress={jardin.terminar} />
            </>
          ) : (
            <>
              <Text style={estilos.etiqueta}>¿Arrancamos?</Text>
              <Text style={[estilos.reloj, estilos.relojApagado]}>00:00</Text>
              <Boton titulo="Empezar a estudiar" onPress={() => jardin.empezar(materia.id)} />
              {otraActiva && (
                <Text style={estilos.aviso}>Se va a terminar la sesión de {otraActiva.nombre}.</Text>
              )}
            </>
          )}
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>¿Te olvidaste de prender el cronómetro?</Text>
          <View style={estilos.fila}>
            {ATAJOS.map((atajo) => (
              <Boton
                key={atajo.minutos}
                titulo={atajo.etiqueta}
                variante="secundario"
                style={estilos.botonFila}
                onPress={() => jardin.agregarTiempo(materia.id, atajo.minutos)}
              />
            ))}
          </View>
        </View>

        <View style={estilos.tarjeta}>
          <View>
            <Text style={estilos.seccion}>Semana a semana</Text>
            <Text style={estilos.textoSuave}>
              Meta: {materia.metaSemanal} h por semana · Cumpliste la meta en {semanasCumplidas} de{' '}
              {semanas.length} {semanas.length === 1 ? 'semana' : 'semanas'}
            </Text>
          </View>
          {semanas.map((semana, i) => {
            const p = calcularProgreso(semana.ms, materia.metaSemanal);
            return (
              <View key={semana.inicio} style={estilos.semana}>
                <Planta progreso={p} color={materia.color} semilla={materia.id} tamano={40} />
                <View style={estilos.semanaDatos}>
                  <View style={estilos.semanaTitulo}>
                    <Text style={[estilos.texto, i === 0 && estilos.negrita]}>{nombreSemana(i, semana.inicio)}</Text>
                    <Text style={estilos.texto}>
                      {p >= 1 ? '🌸 ' : ''}
                      {formatoHoras(semana.ms)}
                    </Text>
                  </View>
                  <BarraProgreso progreso={p} color={materia.color} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={estilos.tarjeta}>
          <Text style={estilos.seccion}>Sesiones recientes</Text>
          {sesiones.length === 0 ? (
            <Text style={estilos.textoSuave}>Todavía no hay sesiones.</Text>
          ) : (
            sesiones.slice(0, SESIONES_VISIBLES).map((s) => (
              <View key={s.id} style={estilos.sesion}>
                <View style={estilos.sesionDatos}>
                  <Text style={estilos.texto}>
                    {formatoHoras(s.fin - s.inicio)}
                    {s.manual ? ' · a mano' : ''}
                  </Text>
                  <Text style={estilos.textoSuave}>{formatoFecha(s.inicio)}</Text>
                </View>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => tocarBorrarSesion(s.id)}>
                  <Text style={[estilos.borrar, sesionABorrar === s.id && estilos.borrarConfirmar]}>
                    {sesionABorrar === s.id ? '¿Borrar?' : 'Borrar'}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
          {sesiones.length > SESIONES_VISIBLES && (
            <Text style={estilos.textoSuave}>y {sesiones.length - SESIONES_VISIBLES} más</Text>
          )}
        </View>

        {confirmarEliminar ? (
          <View style={estilos.tarjeta}>
            <Text style={estilos.texto}>
              ¿Eliminar {materia.nombre} y todo su historial? No se puede deshacer.
            </Text>
            <View style={estilos.fila}>
              <Boton
                titulo="Cancelar"
                variante="secundario"
                style={estilos.botonFila}
                onPress={() => setConfirmarEliminar(false)}
              />
              <Boton titulo="Sí, eliminar" variante="peligro" style={estilos.botonFila} onPress={eliminar} />
            </View>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            style={estilos.eliminar}
            onPress={() => setConfirmarEliminar(true)}>
            <Text style={estilos.borrar}>Eliminar materia</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
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
  noEncontrada: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacio.m,
    padding: Espacio.l,
    backgroundColor: Colores.fondo,
  },
  escena: {
    alignItems: 'center',
    gap: Espacio.xs,
  },
  etapa: {
    color: Colores.texto,
    fontSize: 22,
    fontWeight: '800',
    marginTop: Espacio.s,
  },
  barra: {
    alignSelf: 'stretch',
    marginTop: Espacio.s,
    marginHorizontal: Espacio.xl,
  },
  tarjeta: {
    backgroundColor: Colores.tarjeta,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colores.borde,
    padding: Espacio.m,
    gap: Espacio.m - 4,
  },
  etiqueta: {
    color: Colores.textoSuave,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  reloj: {
    color: Colores.texto,
    fontSize: 52,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  relojApagado: {
    color: Colores.borde,
  },
  aviso: {
    color: Colores.textoSuave,
    fontSize: 13,
    textAlign: 'center',
  },
  seccion: {
    color: Colores.texto,
    fontSize: 16,
    fontWeight: '700',
  },
  fila: {
    flexDirection: 'row',
    gap: Espacio.s,
  },
  botonFila: {
    flex: 1,
    paddingHorizontal: Espacio.s,
  },
  semana: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
    paddingTop: Espacio.xs,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
  },
  semanaDatos: {
    flex: 1,
    gap: Espacio.s,
  },
  semanaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Espacio.s,
  },
  sesion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.s,
    paddingVertical: Espacio.xs,
    borderTopWidth: 1,
    borderTopColor: Colores.borde,
  },
  sesionDatos: {
    flex: 1,
  },
  texto: {
    color: Colores.texto,
    fontSize: 15,
  },
  negrita: {
    fontWeight: '700',
  },
  textoSuave: {
    color: Colores.textoSuave,
    fontSize: 13,
  },
  borrar: {
    color: Colores.peligro,
    fontSize: 14,
  },
  borrarConfirmar: {
    fontWeight: '700',
  },
  eliminar: {
    alignSelf: 'center',
    padding: Espacio.s,
  },
});
