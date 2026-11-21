import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Campo } from '@/components/campo';
import { Encabezado } from '@/components/encabezado';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, Espacio } from '@/constants/theme';
import { useCuenta } from '@/state/cuenta';

export default function Entrar() {
  const router = useRouter();
  const { estado, entrar } = useCuenta();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Cuando la sesión queda iniciada, se vuelve al jardín.
  if (estado === 'conectado') return <Redirect href="/" />;

  const valido = email.includes('@') && contrasena.length > 0;

  const enviar = async () => {
    if (!valido || enviando) return;
    setEnviando(true);
    setError(null);
    const mensaje = await entrar(email, contrasena);
    setEnviando(false);
    if (mensaje) setError(mensaje);
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="Entrar" claro />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          <Campo
            etiqueta="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus
          />
          <Campo
            etiqueta="Contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={enviar}
          />
          {error && (
            <View style={estilos.error} accessibilityRole="alert">
              <Texto color={Colores.blanco}>{error}</Texto>
            </View>
          )}
          <Boton titulo={enviando ? 'Entrando…' : 'Entrar'} onPress={enviar} deshabilitado={!valido || enviando} />
          <Boton
            titulo="¿No tenés cuenta? Creá una"
            variante="secundario"
            onPress={() => router.replace('/registro')}
          />
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
