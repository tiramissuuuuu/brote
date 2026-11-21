import { Redirect, useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arbol, PROPORCION_ARBOL } from '@/components/arbol';
import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';
import { alturaColinaLejana, alturaSuelo, Escena } from '@/components/escena';
import { FilaMateria } from '@/components/fila-materia';
import { Logo } from '@/components/logo';
import { Marco } from '@/components/marco';
import { Panel } from '@/components/panel';
import { TarjetaDato } from '@/components/tarjeta-dato';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useAhora } from '@/hooks/use-ahora';
import { ANCHO_LATERAL, useDisposicion } from '@/hooks/use-disposicion';
import {
  calcularProgreso,
  formatoDuracion,
  formatoReloj,
  formatoSemana,
  inicioSemana,
  msEstaSemana,
  progresoGeneral,
  rachaDias,
  type Materia,
} from '@/lib/brote';
import { useCuenta } from '@/state/cuenta';
import { useJardin } from '@/state/jardin';

const ALTO_ENCABEZADO = 64;
/** En computadora, el contenido no pasa de este ancho. */
const ANCHO_CONTENIDO_ESCRITORIO = 1200;

export default function Jardin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ancho: anchoVentana, escritorio } = useDisposicion();
  const { estado: estadoCuenta } = useCuenta();
  const { materias, sesiones, activa } = useJardin();
  const ahora = useAhora(activa !== null);

  if (estadoCuenta === 'cargando') return null;
  // Primera vez: en la web se muestra la página de inicio; en el celular, directo la bienvenida.
  if (estadoCuenta === 'sin-elegir') return <Redirect href={Platform.OS === 'web' ? '/inicio' : '/bienvenida'} />;

  const ancho = escritorio
    ? Math.min(anchoVentana - ANCHO_LATERAL, ANCHO_CONTENIDO_ESCRITORIO)
    : Math.min(anchoVentana, AnchoMaximo);
  const altoEscena = escritorio ? 400 : insets.top + 300;
  // En computadora la escena es una tarjeta con márgenes a los costados.
  const anchoEscena = escritorio ? ancho - Espacio.m * 2 : ancho;
  const general = progresoGeneral(materias, sesiones, activa, ahora);
  const racha = rachaDias(sesiones, activa, ahora);
  const materiaActiva = activa ? materias.find((m) => m.id === activa.materiaId) : undefined;
  const abrir = (id: string) => router.push({ pathname: '/materia/[id]', params: { id } });

  const resumen =
    materias.length === 0 ? (
      <View style={estilos.vacio}>
        <Texto variante="titulo" color={Colores.blanco} style={estilos.centrado}>
          Tu jardín está vacío
        </Texto>
        <Texto color={Colores.blancoSuave} style={estilos.centrado}>
          Cada materia es un árbol. Plantá la primera: cuanto más estudiás en la semana, más crece.
        </Texto>
      </View>
    ) : (
      <>
        <View>
          <Texto variante="enorme">
            {Math.floor(general.progreso * 100)}
            <Texto variante="enorme" style={estilos.porciento}>
              %
            </Texto>
          </Texto>
          <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
            de tu meta de la semana del {formatoSemana(inicioSemana(ahora))}
          </Texto>
        </View>
        <BarraProgreso progreso={general.progreso} />
        <View style={estilos.datos}>
          <TarjetaDato icono="⏱️" valor={formatoDuracion(general.ms)} etiqueta="Esta semana" />
          <TarjetaDato icono="🎯" valor={`${general.cumplidas}/${materias.length}`} etiqueta="Metas cumplidas" />
          <TarjetaDato
            icono="🌳"
            valor={String(materias.length)}
            etiqueta={materias.length === 1 ? 'Árbol' : 'Árboles'}
          />
        </View>
      </>
    );

  const regando = activa && materiaActiva && (
    <Pressable
      accessibilityRole="button"
      onPress={() => abrir(materiaActiva.id)}
      style={({ pressed }) => [estilos.regando, pressed && { opacity: 0.85 }]}>
      <Texto variante="subtitulo" numberOfLines={1} style={estilos.regandoTexto}>
        💧 Regando {materiaActiva.nombre}
      </Texto>
      <Texto variante="subtitulo" style={estilos.reloj}>
        {formatoReloj(ahora - activa.inicio)}
      </Texto>
    </Pressable>
  );

  const lista = materias.length > 0 && (
    <Panel titulo="Tus materias">
      {materias.map((m) => (
        <FilaMateria
          key={m.id}
          materia={m}
          ms={msEstaSemana(m.id, sesiones, activa, ahora)}
          activa={activa?.materiaId === m.id}
          onPress={() => abrir(m.id)}
        />
      ))}
    </Panel>
  );

  const plantar = <Boton titulo="+ Plantar materia" onPress={() => router.push('/nueva')} />;

  return (
    <Marco seccion="jardin">
      <ScrollView
        contentContainerStyle={[
          estilos.contenido,
          { paddingBottom: escritorio ? Espacio.xl * 2 : insets.bottom + 130 },
        ]}>
        <View style={{ width: ancho }}>
          <View style={escritorio && estilos.escenaEscritorio}>
            <Escena ancho={anchoEscena} alto={altoEscena}>
              <Bosque
                materias={materias}
                msDe={(id) => msEstaSemana(id, sesiones, activa, ahora)}
                ancho={anchoEscena}
                colinaLejana={alturaColinaLejana(anchoEscena, altoEscena)}
                altoDisponible={
                  altoEscena - (escritorio ? 0 : insets.top) - ALTO_ENCABEZADO - alturaSuelo(anchoEscena, altoEscena)
                }
                onTocar={abrir}
              />
            </Escena>
            <View style={[estilos.encabezado, { top: (escritorio ? 0 : insets.top) + Espacio.s }]}>
              {escritorio ? <Texto variante="marca">Tu jardín</Texto> : <Logo />}
              <Racha dias={racha} />
            </View>
          </View>

          {escritorio && materias.length === 0 ? (
            // Computadora sin materias: el mensaje y el botón centrados.
            <View style={[estilos.cuerpo, estilos.vacioEscritorio]}>
              {resumen}
              {plantar}
            </View>
          ) : escritorio ? (
            // Computadora: a la izquierda el resumen de la semana, a la derecha la lista de materias.
            <View style={[estilos.cuerpo, estilos.cuerpoEscritorio]}>
              <View style={estilos.columnaResumen}>
                {resumen}
                {regando}
                {plantar}
              </View>
              <View style={estilos.columnaLista}>{lista}</View>
            </View>
          ) : (
            <View style={estilos.cuerpo}>
              {resumen}
              {regando}
              {lista}
              {plantar}
            </View>
          )}
        </View>
      </ScrollView>
    </Marco>
  );
}

/** Todos los árboles parados en la colina. Si no entran en una fila, se acomodan en dos. */
function Bosque({
  materias,
  msDe,
  ancho,
  colinaLejana,
  altoDisponible,
  onTocar,
}: {
  materias: Materia[];
  msDe: (id: string) => number;
  ancho: number;
  /** Cuánto más arriba se apoya la fila de atrás (sobre la colina del fondo). */
  colinaLejana: number;
  altoDisponible: number;
  onTocar: (id: string) => void;
}) {
  if (materias.length === 0) {
    return <Arbol especie="ombu" progreso={0} color={Colores.amarillo} semilla="vacio" tamano={110} />;
  }

  // Entran más árboles por fila cuanto más ancha es la pantalla.
  const porFila = Math.max(4, Math.floor((ancho - 24) / 130));
  const dosFilas = materias.length > porFila;
  const filas = dosFilas
    ? [materias.filter((_, i) => i % 2 === 1), materias.filter((_, i) => i % 2 === 0)]
    : [materias];
  // La fila de atrás es más chica y se apoya en la colina del fondo; tiene que entrar en el alto disponible.
  const maximoPorAlto = dosFilas
    ? (altoDisponible - colinaLejana) / (PROPORCION_ARBOL * 0.78)
    : altoDisponible / PROPORCION_ARBOL;
  const adelante = Math.min(dosFilas ? 110 : 140, maximoPorAlto, (ancho - 24) / filas[filas.length - 1].length);
  const atras = Math.min(adelante * 0.78, (ancho - 24) / filas[0].length);

  const fila = (lista: Materia[], tamano: number) =>
    lista.map((m) => (
      <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={`Abrir ${m.nombre}`} onPress={() => onTocar(m.id)}>
        <Arbol
          especie={m.especie}
          progreso={calcularProgreso(msDe(m.id), m.metaSemanal)}
          color={m.color}
          semilla={m.id}
          tamano={tamano}
        />
      </Pressable>
    ));

  return (
    <View style={[estilos.bosque, { width: ancho }]}>
      {dosFilas && <View style={[estilos.filaArboles, estilos.filaAtras, { bottom: colinaLejana }]}>{fila(filas[0], atras)}</View>}
      <View style={estilos.filaArboles}>{fila(filas[filas.length - 1], adelante)}</View>
    </View>
  );
}

function Racha({ dias }: { dias: number }) {
  return (
    <View style={estilos.racha} accessible accessibilityLabel={`${dias} días seguidos estudiando`}>
      <View style={estilos.rachaCirculo}>
        <Texto style={estilos.rachaIcono}>🔥</Texto>
      </View>
      <Texto variante="subtitulo">{dias}</Texto>
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
  encabezado: {
    position: 'absolute',
    left: Espacio.m,
    right: Espacio.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  racha: {
    alignItems: 'center',
  },
  rachaCirculo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  rachaIcono: {
    fontSize: 22,
    lineHeight: 28,
  },
  bosque: {
    alignItems: 'center',
  },
  filaAtras: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  filaArboles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  escenaEscritorio: {
    marginTop: Espacio.m,
    marginHorizontal: Espacio.m,
    borderRadius: 28,
    overflow: 'hidden',
  },
  vacioEscritorio: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
    paddingTop: Espacio.xl,
  },
  cuerpoEscritorio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Espacio.l,
    paddingTop: Espacio.l,
  },
  columnaResumen: {
    flex: 1,
    minWidth: 0,
    gap: Espacio.m,
  },
  columnaLista: {
    flex: 1.2,
    minWidth: 0,
  },
  cuerpo: {
    paddingHorizontal: Espacio.m,
    gap: Espacio.m,
  },
  vacio: {
    gap: Espacio.s,
    paddingVertical: Espacio.s,
  },
  centrado: {
    textAlign: 'center',
  },
  porciento: {
    fontSize: 36,
  },
  datos: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
  regando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.s,
    paddingVertical: Espacio.m - 2,
    paddingHorizontal: Espacio.m,
    borderRadius: 18,
    backgroundColor: Colores.amarillo,
    borderBottomWidth: 4,
    borderBottomColor: Colores.amarilloOscuro,
  },
  regandoTexto: {
    flex: 1,
  },
  reloj: {
    fontVariant: ['tabular-nums'],
  },
});
