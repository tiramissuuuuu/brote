import type { AuthError, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';

import { guardar, leer, quitar } from '@/lib/almacenamiento';
import { claveJardin } from '@/lib/brote';
import { supabase } from '@/lib/supabase';

/**
 * - cargando: todavía no sabemos si hay una sesión guardada.
 * - sin-elegir: primera vez (o después de cerrar sesión): hay que mostrar la bienvenida.
 * - invitado: eligió seguir sin cuenta; los datos quedan solo en el dispositivo.
 * - conectado: tiene cuenta; los datos se guardan en la nube.
 */
export type EstadoCuenta = 'cargando' | 'sin-elegir' | 'invitado' | 'conectado';

export type Usuario = { id: string; email: string; nombre: string | null };

type ValorCuenta = {
  estado: EstadoCuenta;
  usuario: Usuario | null;
  /** false si Supabase no está configurado (solo modo invitado). */
  nubeDisponible: boolean;
  /** Devuelve un mensaje de error, o null si salió bien. */
  entrar: (email: string, contrasena: string) => Promise<string | null>;
  registrar: (
    nombre: string,
    email: string,
    contrasena: string,
  ) => Promise<{ error: string | null; confirmarEmail: boolean }>;
  salir: () => Promise<void>;
  seguirComoInvitado: () => void;
};

const CLAVE_INVITADO = 'brote:invitado';

const ContextoCuenta = createContext<ValorCuenta | null>(null);

function aUsuario(user: User | null | undefined): Usuario | null {
  if (!user) return null;
  const nombre = user.user_metadata?.nombre;
  return { id: user.id, email: user.email ?? '', nombre: typeof nombre === 'string' && nombre ? nombre : null };
}

/** Traduce los errores de Supabase a mensajes en español. */
function mensajeDeError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email o contraseña incorrectos.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya hay una cuenta con ese email.';
    case 'weak_password':
      return 'La contraseña tiene que tener al menos 6 caracteres.';
    case 'email_not_confirmed':
      return 'Todavía no confirmaste tu email. Revisá tu correo.';
    case 'email_address_invalid':
      return 'Ese email no es válido.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Demasiados intentos. Esperá un rato y probá de nuevo.';
    default:
      return error.status === 0 || !error.status
        ? 'No se pudo conectar. Revisá tu conexión a internet.'
        : `Algo salió mal: ${error.message}`;
  }
}

export function ProveedorCuenta({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(supabase !== null);
  const [eligioInvitado, setEligioInvitado] = useState(() => leer(CLAVE_INVITADO) === '1');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(aUsuario(data.session?.user));
      setCargando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setUsuario(aUsuario(sesion?.user));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // En el celular, Supabase recomienda renovar la sesión solo mientras la app está abierta.
  useEffect(() => {
    if (!supabase || Platform.OS === 'web') return;
    const cliente = supabase;
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') cliente.auth.startAutoRefresh();
      else cliente.auth.stopAutoRefresh();
    });
    return () => suscripcion.remove();
  }, []);

  const estado: EstadoCuenta = cargando
    ? 'cargando'
    : usuario
      ? 'conectado'
      : eligioInvitado
        ? 'invitado'
        : 'sin-elegir';

  const entrar = async (email: string, contrasena: string) => {
    if (!supabase) return 'Las cuentas todavía no están configuradas.';
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: contrasena });
    return error ? mensajeDeError(error) : null;
  };

  const registrar = async (nombre: string, email: string, contrasena: string) => {
    if (!supabase) return { error: 'Las cuentas todavía no están configuradas.', confirmarEmail: false };
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: contrasena,
      options: { data: { nombre: nombre.trim() } },
    });
    if (error) return { error: mensajeDeError(error), confirmarEmail: false };
    // Si el proyecto pide confirmar el email, Supabase no devuelve sesión hasta que lo confirme.
    return { error: null, confirmarEmail: !data.session };
  };

  const salir = async () => {
    if (!supabase) return;
    const id = usuario?.id;
    await supabase.auth.signOut();
    // Por privacidad, se borra la copia local de esa cuenta (sigue guardada en la nube).
    if (id) quitar(claveJardin(id));
    quitar(CLAVE_INVITADO);
    setEligioInvitado(false);
  };

  const seguirComoInvitado = () => {
    guardar(CLAVE_INVITADO, '1');
    setEligioInvitado(true);
  };

  return (
    <ContextoCuenta.Provider
      value={{
        estado,
        usuario,
        nubeDisponible: supabase !== null,
        entrar,
        registrar,
        salir,
        seguirComoInvitado,
      }}>
      {children}
    </ContextoCuenta.Provider>
  );
}

export function useCuenta(): ValorCuenta {
  const valor = useContext(ContextoCuenta);
  if (!valor) throw new Error('useCuenta tiene que usarse dentro de <ProveedorCuenta>');
  return valor;
}
