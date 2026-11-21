import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * - liviana: un toquecito (botones chicos, como +15 min).
 * - media: como apretar un botón físico (empezar o terminar una sesión).
 * - exito: el festejo al terminar una sesión.
 */
export type Vibracion = 'liviana' | 'media' | 'exito';

// En Android, Expo recomienda las vibraciones del sistema: se sienten como teclas y no piden permisos.
const ANDROID: Record<Vibracion, Haptics.AndroidHaptics> = {
  liviana: Haptics.AndroidHaptics.Keyboard_Tap,
  media: Haptics.AndroidHaptics.Virtual_Key,
  exito: Haptics.AndroidHaptics.Confirm,
};

/** Hace vibrar el celular un instante. Si el dispositivo no puede vibrar, no pasa nada. */
export function vibrar(tipo: Vibracion): void {
  let promesa: Promise<void>;
  if (Platform.OS === 'android') {
    promesa = Haptics.performAndroidHapticsAsync(ANDROID[tipo]);
  } else if (tipo === 'exito') {
    promesa = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else {
    promesa = Haptics.impactAsync(
      tipo === 'liviana' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
  }
  promesa.catch(() => {
    // Sin motor de vibración (o desactivado): se ignora.
  });
}
