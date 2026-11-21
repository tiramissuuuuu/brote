import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Campo } from '@/components/campo';
import { Encabezado } from '@/components/encabezado';
import { Panel } from '@/components/panel';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useCuenta } from '@/state/cuenta';
import { useJardin } from '@/state/jardin';

const LARGO_MINIMO = 6;

export default function Registro() {
  const router = useRouter();
  const { estado, registrar } = useCuenta();
  const { materias } = useJardin();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  // Cuando la cuenta queda creada (y con sesión iniciada), se vuelve al jardín.
  if (estado === 'conectado') return <Redirect href="/" />;

  const valido = nombre.trim().length > 0 && email.includes('@') && contrasena.length >= LARGO_MINIMO;

  const enviar = async () => {
    if (!valido || enviando) return;
    setEnviando(true);
    setError(null);
    const resultado = await registrar(nombre, email, contrasena);
    setEnviando(false);
    if (resultado.error) setError(resultado.error);
    else if (resultado.confirmarEmail) setConfirmar(true);
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="Crear cuenta" claro />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          {confirmar ? (
            <Panel titulo="📬 Revisá tu correo">
              <Texto color={Colores.blanco}>
                Te mandamos un mail a {email.trim()} para confirmar la cuenta. Cuando lo confirmes, entrá con tu
                email y contraseña.
              </Texto>
              <Boton titulo="Ir a entrar" onPress={() => router.replace('/entrar')} />
            </Panel>
          ) : (
            <>
              {materias.length > 0 && (
                <Texto color={Colores.blancoSuave}>
                  🌳 Los {materias.length === 1 ? 'árbol que tenés' : `${materias.length} árboles que tenés`} como
                  invitado se pasan a tu cuenta.
                </Texto>
              )}
              <Campo
                etiqueta="Nombre"
                value={nombre}
                onChangeText={setNombre}
                placeholder="¿Cómo te llamás?"
                autoComplete="name"
                textContentType="name"
                autoFocus
              />
              <Campo
                etiqueta="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Campo
                etiqueta="Contraseña"
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                ayuda={`Al menos ${LARGO_MINIMO} caracteres.`}
                onSubmitEditing={enviar}
              />
              {error && (
                <View style={estilos.error} accessibilityRole="alert">
                  <Texto color={Colores.blanco}>{error}</Texto>
                </View>
              )}
              <Boton
                titulo={enviando ? 'Creando cuenta…' : 'Crear cuenta'}
                onPress={enviar}
                deshabilitado={!valido || enviando}
              />
              <Boton
                titulo="¿Ya tenés cuenta? Entrá"
                variante="secundario"
                onPress={() => router.replace('/entrar')}
              />
            </>
          )}
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
    gap: Espacio.l - 4,
  },
  error: {
    padding: Espacio.m - 4,
    borderRadius: 14,
    backgroundColor: 'rgba(229,72,77,0.55)',
  },
});
