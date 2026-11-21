import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arbol, PROPORCION_ARBOL } from '@/components/arbol';
import { BarraInferior } from '@/components/barra-inferior';
import { BarraProgreso } from '@/components/barra-progreso';
import { Boton } from '@/components/boton';
import { alturaSuelo, Escena } from '@/components/escena';
import { FilaMateria } from '@/components/fila-materia';
import { Panel } from '@/components/panel';
import { TarjetaDato } from '@/components/tarjeta-dato';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useAhora } from '@/hooks/use-ahora';
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

export default function Jardin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { estado: estadoCuenta } = useCuenta();
  const { materias, sesiones, activa } = useJardin();
  const ahora = useAhora(activa !== null);

  if (estadoCuenta === 'cargando') return null;
  if (estadoCuenta === 'sin-elegir') return <Redirect href="/bienvenida" />;

  const ancho = Math.min(width, AnchoMaximo);
  const altoEscena = insets.top + 300;
  const general = progresoGeneral(materias, sesiones, activa, ahora);
  const racha = rachaDias(sesiones, activa, ahora);
  const materiaActiva = activa ? materias.find((m) => m.id === activa.materiaId) : undefined;
  const abrir = (id: string) => router.push({ pathname: '/materia/[id]', params: { id } });

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: insets.bottom + 130 }]}>
        <View style={{ width: ancho }}>
          <View>
            <Escena ancho={ancho} alto={altoEscena}>
              <Bosque
                materias={materias}
                msDe={(id) => msEstaSemana(id, sesiones, activa, ahora)}
                ancho={ancho}
                altoDisponible={altoEscena - insets.top - ALTO_ENCABEZADO - alturaSuelo(ancho, altoEscena)}
                onTocar={abrir}
              />
            </Escena>
            <View style={[estilos.encabezado, { top: insets.top + Espacio.s }]}>
              <Texto variante="marca">Brote</Texto>
              <Racha dias={racha} />
            </View>
          </View>

          <View style={estilos.cuerpo}>
            {materias.length === 0 ? (
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
                  <TarjetaDato
                    icono="🎯"
                    valor={`${general.cumplidas}/${materias.length}`}
                    etiqueta="Metas cumplidas"
                  />
                  <TarjetaDato
                    icono="🌳"
                    valor={String(materias.length)}
                    etiqueta={materias.length === 1 ? 'Árbol' : 'Árboles'}
                  />
                </View>
              </>
            )}

            {activa && materiaActiva && (
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
            )}

            {materias.length > 0 && (
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
            )}

            <Boton titulo="+ Plantar materia" onPress={() => router.push('/nueva')} />
          </View>
        </View>
      </ScrollView>
      <BarraInferior activa="jardin" />
    </View>
  );
}

/** Todos los árboles parados en la colina. Con más de 4, se acomodan en dos filas. */
function Bosque({
  materias,
  msDe,
  ancho,
  altoDisponible,
  onTocar,
}: {
  materias: Materia[];
  msDe: (id: string) => number;
  ancho: number;
  altoDisponible: number;
  onTocar: (id: string) => void;
}) {
  if (materias.length === 0) {
    return <Arbol especie="ombu" progreso={0} color={Colores.amarillo} semilla="vacio" tamano={110} />;
  }

  const dosFilas = materias.length > 4;
  const filas = dosFilas
    ? [materias.filter((_, i) => i % 2 === 1), materias.filter((_, i) => i % 2 === 0)]
    : [materias];
  // Alto total ≈ fila de adelante + 60 % de la de atrás (que queda parcialmente tapada).
  const maximoPorAlto = altoDisponible / (PROPORCION_ARBOL * (dosFilas ? 1.5 : 1));
  const adelante = Math.min(dosFilas ? 110 : 140, maximoPorAlto, (ancho - 24) / filas[filas.length - 1].length);
  const atras = Math.min(adelante * 0.78, (ancho - 24) / filas[0].length);

  return (
    <>
      {filas.map((fila, f) => {
        const esAtras = dosFilas && f === 0;
        const tamano = esAtras ? atras : adelante;
        return (
          <View
            key={f}
            style={[estilos.filaArboles, esAtras && { marginBottom: -tamano * PROPORCION_ARBOL * 0.4 }]}>
            {fila.map((m) => (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${m.nombre}`}
                onPress={() => onTocar(m.id)}>
                <Arbol
                  especie={m.especie}
                  progreso={calcularProgreso(msDe(m.id), m.metaSemanal)}
                  color={m.color}
                  semilla={m.id}
                  tamano={tamano}
                />
              </Pressable>
            ))}
          </View>
        );
      })}
    </>
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
  filaArboles: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
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
