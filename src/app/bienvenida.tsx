import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Arbol } from '@/components/arbol';
import { Boton } from '@/components/boton';
import { Escena } from '@/components/escena';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { ANCHO_ESCRITORIO } from '@/hooks/use-disposicion';
import { useCuenta } from '@/state/cuenta';

export default function Bienvenida() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { estado, nubeDisponible, seguirComoInvitado } = useCuenta();

  if (estado === 'conectado' || estado === 'invitado') return <Redirect href="/" />;

  // Celular: la escena arriba. Computadora: la escena a la izquierda (alto completo) y los botones a la derecha.
  const escritorio = width >= ANCHO_ESCRITORIO;
  const anchoEscena = escritorio ? Math.min(width * 0.55, 900) : Math.min(width, AnchoMaximo);
  const altoEscena = escritorio ? height : insets.top + 330;
  const tamano = escritorio ? Math.min(190, anchoEscena / 4) : Math.min(118, (anchoEscena - 40) / 3);

  const escena = (
    <View style={escritorio && { width: anchoEscena }}>
      <Escena ancho={anchoEscena} alto={altoEscena} altoDibujo={escritorio ? Math.min(height * 0.7, 560) : altoEscena}>
        <View style={estilos.arboles}>
          <Arbol especie="ceibo" progreso={1} color="#E63946" semilla="b" tamano={tamano * 0.85} />
          <Arbol especie="ombu" progreso={0.85} color="#9B5DE5" semilla="a" tamano={tamano} />
          <Arbol especie="butia" progreso={1} color="#F4A261" semilla="c" tamano={tamano * 0.85} />
        </View>
      </Escena>
      <View style={[estilos.marca, { top: (escritorio ? Espacio.xl : insets.top) + Espacio.l }]}>
        <Texto variante="marca" style={estilos.titulo}>
          Brote
        </Texto>
      </View>
    </View>
  );

  const opciones = (
    <View style={estilos.cuerpo}>
      <View style={estilos.textos}>
        <Texto variante="titulo" color={Colores.blanco} style={estilos.centrado}>
          Cada materia es un árbol
        </Texto>
        <Texto color={Colores.blancoSuave} style={estilos.centrado}>
          Cuanto más estudiás en la semana, más crece. Con una cuenta, tu jardín queda guardado aunque
          cambies de celular.
        </Texto>
      </View>

      <Boton titulo="Crear cuenta" onPress={() => router.push('/registro')} deshabilitado={!nubeDisponible} />
      <Boton
        titulo="Ya tengo cuenta"
        variante="claro"
        onPress={() => router.push('/entrar')}
        deshabilitado={!nubeDisponible}
      />
      <Boton titulo="Seguir como invitado" variante="secundario" onPress={seguirComoInvitado} />

      <Texto variante="chico" color={Colores.blancoSuave} style={estilos.centrado}>
        {nubeDisponible
          ? 'Como invitado, tus árboles se guardan solo en este dispositivo. Podés crear una cuenta después y se pasan solos.'
          : 'Las cuentas todavía no están configuradas en esta versión (falta conectar Supabase). Por ahora podés usar la app como invitado.'}
      </Texto>
    </View>
  );

  if (escritorio) {
    return (
      <View style={[estilos.pantalla, estilos.dosColumnas]}>
        {escena}
        <ScrollView style={estilos.columnaDerecha} contentContainerStyle={estilos.centroVertical}>
          <View style={estilos.anchoOpciones}>{opciones}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={[estilos.contenido, { paddingBottom: insets.bottom + Espacio.xl }]}>
        <View style={{ width: anchoEscena }}>
          {escena}
          {opciones}
        </View>
      </ScrollView>
    </View>
  );
}

const estilos = StyleSheet.create({
  dosColumnas: {
    flexDirection: 'row',
  },
  columnaDerecha: {
    flex: 1,
  },
  centroVertical: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Espacio.xl,
  },
  anchoOpciones: {
    width: '100%',
    maxWidth: 440,
  },
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  contenido: {
    alignItems: 'center',
  },
  arboles: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  marca: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 44,
  },
  cuerpo: {
    paddingHorizontal: Espacio.m,
    gap: Espacio.m - 2,
  },
  textos: {
    gap: Espacio.s,
    marginBottom: Espacio.s,
  },
  centrado: {
    textAlign: 'center',
  },
});
