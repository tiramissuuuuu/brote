import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colores } from '@/constants/theme';
import { ProveedorJardin } from '@/state/jardin';

export default function Layout() {
  return (
    <ProveedorJardin>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colores.fondo },
          headerTintColor: Colores.verdeOscuro,
          headerTitleStyle: { color: Colores.texto },
          headerShadowVisible: false,
          headerBackTitle: 'Jardín',
          contentStyle: { backgroundColor: Colores.fondo },
        }}>
        <Stack.Screen name="index" options={{ title: 'Tu jardín', headerShown: false }} />
        <Stack.Screen name="materia/[id]" options={{ title: '' }} />
        <Stack.Screen name="nueva" options={{ title: 'Nueva materia', presentation: 'modal' }} />
      </Stack>
    </ProveedorJardin>
  );
}
