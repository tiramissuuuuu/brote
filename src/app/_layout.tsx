import { Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold, useFonts } from '@expo-google-fonts/fredoka';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Colores } from '@/constants/theme';
import { ProveedorCuenta, useCuenta } from '@/state/cuenta';
import { ProveedorJardin } from '@/state/jardin';

// La pantalla de carga se queda hasta que estén la tipografía y la sesión guardada.
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fuentesCargadas, errorFuentes] = useFonts({ Fredoka_500Medium, Fredoka_600SemiBold, Fredoka_700Bold });
  if (!fuentesCargadas && errorFuentes === null) return null;

  return (
    <ProveedorCuenta>
      <App />
    </ProveedorCuenta>
  );
}

function App() {
  const { estado } = useCuenta();
  const listo = estado !== 'cargando';

  useEffect(() => {
    if (listo) SplashScreen.hideAsync();
  }, [listo]);

  // Hasta saber si hay una sesión guardada no se muestra nada: si no, las pantallas buscarían
  // los datos en el jardín de invitado (por ejemplo, al abrir el link de una materia).
  if (!listo) return null;

  return (
    <ProveedorJardin>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colores.pasto } }}>
        <Stack.Screen name="index" options={{ title: 'Tu jardín', animation: 'none' }} />
        <Stack.Screen name="cuenta" options={{ title: 'Tu cuenta', animation: 'none' }} />
        <Stack.Screen name="materia/[id]" options={{ title: 'Materia' }} />
        <Stack.Screen name="nueva" options={{ title: 'Plantar materia', presentation: 'modal' }} />
        <Stack.Screen name="estudiar" options={{ title: '¿Qué vas a estudiar?', presentation: 'modal' }} />
        <Stack.Screen name="grupo/[id]" options={{ title: 'Grupo' }} />
        <Stack.Screen name="unirse/[codigo]" options={{ title: 'Invitación a un grupo' }} />
        <Stack.Screen name="inicio" options={{ title: 'Brote · Cada materia es un árbol', animation: 'fade' }} />
        <Stack.Screen name="bienvenida" options={{ title: 'Brote', animation: 'fade' }} />
        <Stack.Screen name="entrar" options={{ title: 'Entrar' }} />
        <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
      </Stack>
    </ProveedorJardin>
  );
}
