import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arbol, PROPORCION_ARBOL } from '@/components/arbol';
import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';
import { Encabezado } from '@/components/encabezado';
import { alturaSuelo, Escena } from '@/components/escena';
import { Festejo } from '@/components/festejo';
import { ModoFoco } from '@/components/modo-foco';
import { Panel } from '@/components/panel';
import { TarjetaDato } from '@/components/tarjeta-dato';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useAhora } from '@/hooks/use-ahora';
import { useDisposicion } from '@/hooks/use-disposicion';
import {
  calcularProgreso,
  formatoDuracion,
  formatoFecha,
  formatoSemana,
  historialSemanal,
  nombreEtapa,
} from '@/lib/brote';
import { ESPECIES } from '@/lib/especies';
import { vibrar } from '@/lib/vibrar';
import { useJardin } from '@/state/jardin';

const ATAJOS = [
  { etiqueta: '+15 min', minutos: 15 },
  { etiqueta: '+30 min', minutos: 30 },
  { etiqueta: '+1 h', minutos: 60 },
];

const SESIONES_VISIBLES = 20;
const ALTO_ENCABEZADO = 64;

function nombreSemana(indice: number, inicio: number): string {
  if (indice === 0) return 'Esta semana';
  if (indice === 1) return 'Semana pasada';
  return formatoSemana(inicio);
}

export default function PantallaMateria() {
  const { id, plantada } = useLocalSearchParams<{ id: string; plantada?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ancho: anchoVentana, alto: altoVentana, escritorio } = useDisposicion();
  const jardin = useJardin();
  const ahora = useAhora(jardin.activa !== null);
  const [sesionABorrar, setSesionABorrar] = useState<string | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  // Al terminar una sesión: cuánto duró, para el festejo.
  const [sesionTerminada, setSesionTerminada] = useState<number | null>(null);

  const materia = jardin.materias.find((m) => m.id === id);
  if (!materia) return <Redirect href="/" />;

  const especie = ESPECIES[materia.especie];
  const { activa } = jardin;
  const estaActiva = activa?.materiaId === materia.id;
  const otraActiva = activa && !estaActiva ? jardin.materias.find((m) => m.id === activa.materiaId) : undefined;

  const semanas = historialSemanal(materia, jardin.sesiones, activa, ahora);
  const msSemana = semanas[0].ms;
  const progreso = calcularProgreso(msSemana, materia.metaSemanal);
  const cumplidas = semanas.filter((s) => calcularProgreso(s.ms, materia.metaSemanal) >= 1).length;
  const sesiones = jardin.sesiones
    .filter((s) => s.materiaId === materia.id)
    .sort((a, b) => b.inicio - a.inicio);

  // Celular: la escena arriba, a todo lo ancho. Computadora: la escena a la izquierda, de alto completo.
  const anchoEscena = escritorio
    ? Math.min(Math.max(anchoVentana * 0.5, 420), 760)
    : Math.min(anchoVentana, AnchoMaximo);
  const altoEscena = escritorio ? altoVentana : insets.top + 380;
  const altoDibujo = escritorio ? Math.min(altoVentana * 0.7, 560) : altoEscena;
  const espacioArbol =
    altoEscena - (escritorio ? 0 : insets.top) - ALTO_ENCABEZADO - alturaSuelo(anchoEscena, altoEscena, altoDibujo);
  const tamanoArbol = Math.min(anchoEscena * 0.62, espacioArbol / PROPORCION_ARBOL);

  const tocarBorrarSesion = (sesionId: string) => {
    if (sesionABorrar === sesionId) {
      jardin.borrarSesion(sesionId);
      setSesionABorrar(null);
    } else {
      setSesionABorrar(sesionId);
    }
  };

  const eliminar = () => {
    router.replace('/');
    jardin.archivarMateria(materia.id);
  };

  // Mientras se estudia, solo el modo foco.
  if (estaActiva && activa) {
    const terminarSesion = () => {
      vibrar('exito');
      setSesionTerminada(Date.now() - activa.inicio);
      jardin.terminar();
    };
    return (
      <ModoFoco materia={materia} inicio={activa.inicio} ahora={ahora} progreso={progreso} onTerminar={terminarSesion} />
    );
  }

  const escena = (
    <View style={escritorio && { width: anchoEscena }}>
      <Escena ancho={anchoEscena} alto={altoEscena} altoDibujo={altoDibujo}>
        <Arbol
          especie={materia.especie}
          progreso={progreso}
          color={materia.color}
          semilla={materia.id}
          tamano={tamanoArbol}
        />
      </Escena>
      {!escritorio && (
        <View style={estilos.encabezado}>
          <Encabezado titulo={materia.nombre} />
        </View>
      )}
    </View>
  );

  const cuerpo = (
    <View style={estilos.cuerpo}>
      {plantada === '1' && sesiones.length === 0 && (
        <View style={estilos.sorpresa}>
          <Texto variante="subtitulo" style={estilos.centrado}>
            🎉 ¡Te tocó un {especie.nombre}!
          </Texto>
          <Texto variante="chico" style={estilos.centrado}>
            {especie.dato}
          </Texto>
        </View>
      )}

      <View>
        <Texto variante="enorme">
          {Math.floor(progreso * 100)}
          <Texto variante="enorme" style={estilos.porciento}>
            %
          </Texto>
        </Texto>
        <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
          {`${nombreEtapa(progreso)} · ${formatoDuracion(msSemana)} de ${materia.metaSemanal}h esta semana`}
        </Texto>
      </View>
      <BarraProgreso progreso={progreso} />

      <View style={estilos.fila}>
        <TarjetaDato icono="⏱️" valor={formatoDuracion(msSemana)} etiqueta="Esta semana" />
        <TarjetaDato icono="🎯" valor={`${materia.metaSemanal}h`} etiqueta="Meta semanal" />
        <TarjetaDato icono="🌸" valor={`${cumplidas}/${semanas.length}`} etiqueta="Semanas cumplidas" />
      </View>

      <View style={estilos.grupo}>
        <Boton titulo="🌱 Empezar a estudiar" vibracion="media" onPress={() => jardin.empezar(materia.id)} />
        {otraActiva && (
          <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
            Se va a terminar la sesión de {otraActiva.nombre}.
          </Texto>
        )}
      </View>

      <Panel titulo="¿Te olvidaste del cronómetro?" subtitulo="Sumá el tiempo que estudiaste">
        <View style={estilos.fila}>
          {ATAJOS.map((atajo) => (
            <Boton
              key={atajo.minutos}
              titulo={atajo.etiqueta}
              variante="secundario"
              vibracion="liviana"
              style={estilos.botonFila}
              onPress={() => jardin.agregarTiempo(materia.id, atajo.minutos)}
            />
          ))}
        </View>
      </Panel>

      <Panel
        titulo="Semana a semana"
        subtitulo={`Cumpliste la meta en ${cumplidas} de ${semanas.length} ${semanas.length === 1 ? 'semana' : 'semanas'}`}>
        {semanas.map((semana, i) => {
          const p = calcularProgreso(semana.ms, materia.metaSemanal);
          return (
            <View key={semana.inicio} style={estilos.semana}>
              <View style={estilos.semanaArbol}>
                <Arbol
                  especie={materia.especie}
                  progreso={p}
                  color={materia.color}
                  semilla={materia.id}
                  tamano={40}
                />
              </View>
              <View style={estilos.semanaDatos}>
                <View style={estilos.semanaTitulo}>
                  <Texto variante={i === 0 ? 'subtitulo' : 'cuerpo'} color={Colores.blanco}>
                    {nombreSemana(i, semana.inicio)}
                  </Texto>
                  <Texto variante="subtitulo" color={Colores.blanco}>
                    {p >= 1 ? '🌸 ' : ''}
                    {formatoDuracion(semana.ms)}
                  </Texto>
                </View>
                <BarraProgreso progreso={p} alto={8} />
              </View>
            </View>
          );
        })}
      </Panel>

      <Panel titulo={`Tu ${especie.nombre.toLowerCase()}`} subtitulo={especie.cientifico}>
        <Texto color={Colores.blanco}>{especie.dato}</Texto>
      </Panel>

      <Panel titulo="Sesiones recientes">
        {sesiones.length === 0 ? (
          <Texto variante="chico" color={Colores.blancoSuave}>
            Todavía no hay sesiones.
          </Texto>
        ) : (
          sesiones.slice(0, SESIONES_VISIBLES).map((s) => (
            <View key={s.id} style={estilos.sesion}>
              <View style={estilos.sesionDatos}>
                <Texto color={Colores.blanco}>
                  {formatoDuracion(s.fin - s.inicio)}
                  {s.manual ? ' · a mano' : ''}
                </Texto>
                <Texto variante="chico" color={Colores.blancoSuave}>
                  {formatoFecha(s.inicio)}
                </Texto>
              </View>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => tocarBorrarSesion(s.id)}>
                <Texto variante={sesionABorrar === s.id ? 'subtitulo' : 'cuerpo'} color="#FFD1D1">
                  {sesionABorrar === s.id ? '¿Borrar?' : 'Borrar'}
                </Texto>
              </Pressable>
            </View>
          ))
        )}
        {sesiones.length > SESIONES_VISIBLES && (
          <Texto variante="chico" color={Colores.blancoSuave}>
            y {sesiones.length - SESIONES_VISIBLES} más
          </Texto>
        )}
      </Panel>

      {confirmarEliminar ? (
        <Panel
          titulo={`¿Eliminar ${materia.nombre}?`}
          subtitulo="Se saca de tu jardín. Las horas que estudiaste se guardan para tus estadísticas del año.">

          <View style={estilos.fila}>
            <Boton
              titulo="Cancelar"
              variante="secundario"
              style={estilos.botonFila}
              onPress={() => setConfirmarEliminar(false)}
            />
            <Boton titulo="Sí, eliminar" variante="peligro" style={estilos.botonFila} onPress={eliminar} />
          </View>
        </Panel>
      ) : (
        <Pressable
          accessibilityRole="button"
          style={estilos.eliminar}
          onPress={() => setConfirmarEliminar(true)}>
          <Texto color="#FFD1D1">Eliminar materia</Texto>
        </Pressable>
      )}
    </View>
  );

  const festejo = sesionTerminada !== null && (
    <Festejo
      ms={sesionTerminada}
      especie={especie.nombre}
      progreso={progreso}
      onCerrar={() => setSesionTerminada(null)}
    />
  );

  if (escritorio) {
    // Computadora: el panel con la información a la izquierda y el árbol a la derecha (fijo, de alto completo).
    return (
      <View style={[estilos.pantalla, estilos.dosColumnas]}>
        <ScrollView
          style={estilos.columnaPanel}
          contentContainerStyle={estilos.contenidoEscritorio}
          // Sin barra de scroll: quedaba en el medio de la pantalla. Se sigue pudiendo scrollear.
          showsVerticalScrollIndicator={false}>
          <View style={estilos.anchoLectura}>
            <Encabezado titulo={materia.nombre} claro />
            {cuerpo}
          </View>
        </ScrollView>
        {escena}
        {festejo}
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: insets.bottom + Espacio.xl * 2 }]}>
        <View style={{ width: anchoEscena }}>
          {escena}
          {cuerpo}
        </View>
      </ScrollView>
      {festejo}
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  contenido: {
    alignItems: 'center',
  },
  dosColumnas: {
    flexDirection: 'row',
  },
  columnaPanel: {
    flex: 1,
  },
  contenidoEscritorio: {
    alignItems: 'center',
    paddingBottom: Espacio.xl,
  },
  anchoLectura: {
    width: '100%',
    maxWidth: AnchoMaximo,
  },
  encabezado: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  cuerpo: {
    paddingHorizontal: Espacio.m,
    gap: Espacio.m,
  },
  sorpresa: {
    gap: Espacio.xs,
    padding: Espacio.m,
    borderRadius: 18,
    backgroundColor: Colores.amarillo,
  },
  centrado: {
    textAlign: 'center',
  },
  porciento: {
    fontSize: 36,
  },
  fila: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
  grupo: {
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
  },
  semanaArbol: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  semanaDatos: {
    flex: 1,
    gap: 6,
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
    paddingTop: Espacio.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  sesionDatos: {
    flex: 1,
  },
  eliminar: {
    alignSelf: 'center',
    padding: Espacio.s,
  },
});
