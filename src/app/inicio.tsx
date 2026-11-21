import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arbol } from '@/components/arbol';
import { Boton } from '@/components/boton';
import { Escena } from '@/components/escena';
import { Logo } from '@/components/logo';
import { Texto } from '@/components/texto';
import { Colores, Espacio } from '@/constants/theme';
import { useDisposicion } from '@/hooks/use-disposicion';
import { ESPECIES, IDS_ESPECIES, type EspecieId } from '@/lib/especies';
import { useCuenta } from '@/state/cuenta';

/** Ancho máximo de las secciones en pantallas grandes. */
const ANCHO_SECCION = 1100;

const COLORES: Record<EspecieId, string> = {
  ombu: '#9B5DE5',
  ceibo: '#E63946',
  jacaranda: '#9B5DE5',
  butia: '#F4A261',
  sauce: '#FFD166',
};

const PASOS = [
  { icono: '🌱', titulo: 'Plantá tus materias', texto: 'Cada materia es un árbol. Elegí cuántas horas por semana le querés dedicar.' },
  { icono: '⏱️', titulo: 'Estudiá con el cronómetro', texto: 'Un modo foco sin distracciones. Si te olvidaste de prenderlo, sumás el tiempo a mano.' },
  { icono: '🌸', titulo: 'Mirá cómo crece', texto: 'Cuanto más estudiás en la semana, más crece tu árbol, hasta florecer. Cada lunes, de nuevo.' },
];

const FUNCIONES = [
  { icono: '🎯', titulo: 'Meta semanal', texto: 'Ponele a cada materia sus horas por semana y seguí tu avance con una barra.' },
  { icono: '💧', titulo: 'Modo foco', texto: 'Mientras estudiás, solo el cronómetro y tu árbol. Al terminar, confeti.' },
  { icono: '📅', titulo: 'Semana a semana', texto: 'Mirá cuántas horas le dedicaste a cada materia en las semanas anteriores.' },
  { icono: '☁️', titulo: 'Tu jardín en la nube', texto: 'Con una cuenta lo tenés en el celular y en la compu. También podés usarla sin cuenta.' },
];

/** Página de inicio de la web: presenta la app y lleva a crear cuenta, entrar o al jardín. */
export default function Inicio() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { ancho, escritorio } = useDisposicion();
  const { estado } = useCuenta();

  const yaUsa = estado === 'conectado' || estado === 'invitado';
  const empezar = () => router.push(yaUsa ? '/' : '/bienvenida');

  const altoPortada = escritorio ? 600 : 650;
  const especiesPortada = escritorio ? IDS_ESPECIES : (['ceibo', 'ombu', 'butia'] as EspecieId[]);
  const tamanoArbol = escritorio ? 150 : Math.min(120, (ancho - 32) / 3);
  // Columnas de las tarjetas según el ancho.
  const columnas = escritorio ? 3 : ancho >= 600 ? 2 : 1;
  const anchoSeccion = Math.min(ancho, ANCHO_SECCION) - Espacio.m * 2;
  const anchoTarjeta = (anchoSeccion - Espacio.m * (columnas - 1)) / columnas;
  const columnasEspecies = escritorio ? 5 : ancho >= 600 ? 3 : 2;
  const anchoEspecie = (anchoSeccion - Espacio.m * (columnasEspecies - 1)) / columnasEspecies;

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={{ paddingBottom: insets.bottom + Espacio.xl }}>
      {/* Portada */}
      <View>
        <Escena ancho={ancho} alto={altoPortada + insets.top} altoDibujo={escritorio ? 380 : 320}>
          <View style={estilos.arboles}>
            {especiesPortada.map((id, i) => (
              <Arbol
                key={id}
                especie={id}
                progreso={1}
                color={COLORES[id]}
                semilla={id}
                tamano={tamanoArbol * (i % 2 === 0 ? 0.85 : 1)}
              />
            ))}
          </View>
        </Escena>

        <View style={[estilos.barra, { top: insets.top + Espacio.m }]}>
          <View style={[estilos.barraInterna, { maxWidth: ANCHO_SECCION }]}>
            <Logo conIcono />
            <View style={estilos.fila}>
              {!yaUsa && (
                <Boton titulo="Entrar" variante="claro" onPress={() => router.push('/entrar')} style={estilos.botonChico} />
              )}
              {escritorio && (
                <Boton titulo={yaUsa ? 'Mi jardín' : 'Empezar'} onPress={empezar} style={estilos.botonChico} />
              )}
            </View>
          </View>
        </View>

        <View style={[estilos.titular, { top: insets.top + (escritorio ? 120 : 100) }]}>
          <Texto variante="marca" style={[estilos.centrado, { fontSize: escritorio ? 52 : 34, lineHeight: escritorio ? 60 : 40 }]}>
            Cada materia es un árbol
          </Texto>
          <Texto variante="subtitulo" style={[estilos.centrado, estilos.bajada]}>
            Registrá tus horas de estudio y mirá crecer un árbol de Uruguay por cada materia de la facultad.
          </Texto>
          <View style={[estilos.fila, estilos.ctas]}>
            <Boton titulo={yaUsa ? '🌳 Abrir mi jardín' : '🌱 Empezar gratis'} onPress={empezar} />
            {!yaUsa && <Boton titulo="Ya tengo cuenta" variante="claro" onPress={() => router.push('/entrar')} />}
          </View>
        </View>
      </View>

      {/* Cómo funciona */}
      <Seccion titulo="Cómo funciona" ancho={anchoSeccion}>
        <View style={estilos.grilla}>
          {PASOS.map((paso, i) => (
            <Tarjeta key={paso.titulo} ancho={anchoTarjeta} icono={paso.icono} titulo={`${i + 1}. ${paso.titulo}`} texto={paso.texto} />
          ))}
        </View>
      </Seccion>

      {/* Funciones */}
      <Seccion titulo="Lo que trae" ancho={anchoSeccion}>
        <View style={estilos.grilla}>
          {FUNCIONES.map((f) => (
            <Tarjeta key={f.titulo} ancho={anchoTarjeta} icono={f.icono} titulo={f.titulo} texto={f.texto} />
          ))}
        </View>
      </Seccion>

      {/* Especies */}
      <Seccion titulo="Los árboles" ancho={anchoSeccion}>
        <View style={estilos.grilla}>
          {IDS_ESPECIES.map((id) => (
            <View key={id} style={[estilos.tarjeta, estilos.especie, { width: anchoEspecie }]}>
              <Arbol especie={id} progreso={1} color={COLORES[id]} semilla={id} tamano={Math.min(110, anchoEspecie - 40)} />
              <Texto variante="subtitulo" color={Colores.blanco} style={estilos.centrado}>
                {ESPECIES[id].nombre}
              </Texto>
              <Texto variante="chico" color={Colores.blancoSuave} style={[estilos.centrado, estilos.cursiva]}>
                {ESPECIES[id].cientifico}
              </Texto>
              <Texto variante="chico" color={Colores.blanco} style={estilos.centrado}>
                {ESPECIES[id].dato}
              </Texto>
            </View>
          ))}
        </View>
      </Seccion>

      {/* Cierre */}
      <Seccion ancho={anchoSeccion}>
        <View style={estilos.cierre}>
          <Texto variante="titulo" color={Colores.blanco} style={estilos.centrado}>
            ¿Arrancamos?
          </Texto>
          <Texto color={Colores.blancoSuave} style={estilos.centrado}>
            Es gratis. Podés empezar sin cuenta y crearla después: tus árboles se pasan solos.
          </Texto>
          <Boton titulo={yaUsa ? '🌳 Abrir mi jardín' : '🌱 Empezar gratis'} onPress={empezar} style={estilos.botonCierre} />
          <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
            Hecho en Uruguay 🇺🇾
          </Texto>
        </View>
      </Seccion>
    </ScrollView>
  );
}

function Seccion({ titulo, ancho, children }: { titulo?: string; ancho: number; children: React.ReactNode }) {
  return (
    <View style={estilos.seccion}>
      <View style={{ width: ancho, gap: Espacio.m }}>
        {titulo && (
          <Texto variante="titulo" color={Colores.blanco} style={estilos.centrado}>
            {titulo}
          </Texto>
        )}
        {children}
      </View>
    </View>
  );
}

function Tarjeta({ ancho, icono, titulo, texto }: { ancho: number; icono: string; titulo: string; texto: string }) {
  return (
    <View style={[estilos.tarjeta, { width: ancho }]}>
      <Texto style={estilos.icono}>{icono}</Texto>
      <Texto variante="subtitulo" color={Colores.blanco}>
        {titulo}
      </Texto>
      <Texto color={Colores.blancoSuave}>{texto}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  arboles: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Espacio.s,
  },
  barra: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Espacio.m,
  },
  barraInterna: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titular: {
    position: 'absolute',
    left: Espacio.m,
    right: Espacio.m,
    alignItems: 'center',
    gap: Espacio.m,
  },
  bajada: {
    maxWidth: 560,
  },
  fila: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
  ctas: {
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  botonChico: {
    paddingVertical: 10,
  },
  centrado: {
    textAlign: 'center',
  },
  cursiva: {
    fontStyle: 'italic',
  },
  seccion: {
    alignItems: 'center',
    paddingTop: Espacio.xl + Espacio.m,
  },
  grilla: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.m,
  },
  tarjeta: {
    gap: Espacio.s,
    padding: Espacio.l - 4,
    borderRadius: 22,
    backgroundColor: Colores.pastoOscuro,
  },
  especie: {
    alignItems: 'center',
  },
  icono: {
    fontSize: 32,
    lineHeight: 40,
  },
  cierre: {
    alignItems: 'center',
    gap: Espacio.m,
    padding: Espacio.xl,
    borderRadius: 28,
    backgroundColor: Colores.panel,
  },
  botonCierre: {
    minWidth: 260,
  },
});
