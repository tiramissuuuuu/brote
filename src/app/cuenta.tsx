import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarraInferior } from '@/components/barra-inferior';
import { Boton } from '@/components/boton';
import { Panel } from '@/components/panel';
import { TarjetaDato } from '@/components/tarjeta-dato';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { formatoDuracion } from '@/lib/brote';
import { useCuenta } from '@/state/cuenta';
import { useJardin, type EstadoNube } from '@/state/jardin';

const TEXTO_NUBE: Record<EstadoNube, string> = {
  'solo-dispositivo': '📱 Guardado solo en este dispositivo',
  sincronizando: '🔄 Guardando en la nube…',
  guardado: '☁️ Todo guardado en la nube',
  'sin-conexion': '⚠️ Sin conexión: los cambios quedan acá y se suben cuando vuelva',
};

export default function Cuenta() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { estado, usuario, nubeDisponible, salir } = useCuenta();
  const { materias, sesiones, nube } = useJardin();
  const [saliendo, setSaliendo] = useState(false);

  if (estado === 'cargando') return null;
  if (estado === 'sin-elegir') return <Redirect href="/bienvenida" />;

  const conectado = estado === 'conectado' && usuario;
  const nombre = conectado ? (usuario.nombre ?? usuario.email.split('@')[0]) : 'Invitado';
  const totalMs = sesiones.reduce((suma, s) => suma + (s.fin - s.inicio), 0);

  const cerrarSesion = async () => {
    setSaliendo(true);
    await salir();
  };

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={[
          estilos.contenido,
          { paddingTop: insets.top + Espacio.m, paddingBottom: insets.bottom + 130 },
        ]}>
        <View style={estilos.columna}>
          <Texto variante="marca" color={Colores.blanco}>
            Tu cuenta
          </Texto>

          <Panel>
            <View style={estilos.perfil}>
              <View style={estilos.avatar}>
                <Texto variante="titulo">{conectado ? nombre.charAt(0).toUpperCase() : '🌱'}</Texto>
              </View>
              <View style={estilos.perfilDatos}>
                <Texto variante="titulo" color={Colores.blanco} numberOfLines={1}>
                  {nombre}
                </Texto>
                <Texto variante="chico" color={Colores.blancoSuave} numberOfLines={1}>
                  {conectado ? usuario.email : 'Sin cuenta'}
                </Texto>
              </View>
            </View>
            <View style={estilos.nube}>
              <Texto variante="chico" color={Colores.blanco}>
                {TEXTO_NUBE[nube]}
              </Texto>
            </View>
          </Panel>

          <View style={estilos.fila}>
            <TarjetaDato icono="🌳" valor={String(materias.length)} etiqueta={materias.length === 1 ? 'Árbol' : 'Árboles'} />
            <TarjetaDato icono="⏱️" valor={formatoDuracion(totalMs)} etiqueta="En total" />
            <TarjetaDato icono="📚" valor={String(sesiones.length)} etiqueta="Sesiones" />
          </View>

          {conectado ? (
            <Boton
              titulo={saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
              variante="secundario"
              onPress={cerrarSesion}
              deshabilitado={saliendo}
            />
          ) : (
            <Panel
              titulo="Estás como invitado"
              subtitulo="Tus árboles se guardan solo en este dispositivo: si lo perdés o borrás la app, se pierden. Creá una cuenta y se pasan solos.">
              <Boton titulo="Crear cuenta" onPress={() => router.push('/registro')} deshabilitado={!nubeDisponible} />
              <Boton
                titulo="Ya tengo cuenta"
                variante="claro"
                onPress={() => router.push('/entrar')}
                deshabilitado={!nubeDisponible}
              />
              {!nubeDisponible && (
                <Texto variante="chico" color={Colores.blancoSuave}>
                  Las cuentas todavía no están configuradas en esta versión (falta conectar Supabase).
                </Texto>
              )}
            </Panel>
          )}
        </View>
      </ScrollView>
      <BarraInferior activa="cuenta" />
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.pasto,
  },
  contenido: {
    paddingHorizontal: Espacio.m,
    alignItems: 'center',
  },
  columna: {
    width: '100%',
    maxWidth: AnchoMaximo - Espacio.m * 2,
    gap: Espacio.m,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.amarillo,
  },
  perfilDatos: {
    flex: 1,
  },
  nube: {
    paddingVertical: Espacio.s,
    paddingHorizontal: Espacio.m - 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  fila: {
    flexDirection: 'row',
    gap: Espacio.s + 2,
  },
});
