import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { almacenAuth } from '@/lib/almacenamiento';

// Se configuran en .env.local (ver README). Expo solo expone al código las variables que empiezan con EXPO_PUBLIC_.
// La "publishable key" (o "anon key") está pensada para ir dentro de la app: lo que protege los datos son las
// reglas de seguridad de la tabla (ver supabase/esquema.sql). La "secret key" NUNCA va acá.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const clave = process.env.EXPO_PUBLIC_SUPABASE_KEY;

/** null si Supabase no está configurado: en ese caso la app funciona solo en modo invitado. */
export const supabase: SupabaseClient | null =
  url && clave
    ? createClient(url, clave, {
        auth: {
          storage: almacenAuth,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;
