# brote 🌱

Cada materia de la facultad es un árbol: cuanto más estudiás en la semana, más crece.

Hecha con [Expo](https://expo.dev) (React Native), así que el mismo código corre en web, iOS y Android.

## Cómo correrlo

Necesitás [Node.js](https://nodejs.org) (versión LTS).

```bash
npm install
npm run web
```

Se abre en el navegador en http://localhost:8081.

Para probarla en el celular: instalá **Expo Go** desde la App Store o Google Play, corré `npx expo start` y escaneá el código QR (el celular y la computadora tienen que estar en la misma red Wi‑Fi).

Sin configurar nada más, la app funciona en **modo invitado** (los datos quedan en el dispositivo). Para las cuentas, seguí los pasos de abajo.

## Conectar las cuentas (Supabase)

1. Creá un proyecto gratis en [supabase.com](https://supabase.com).
2. En **SQL Editor → New query**, pegá el contenido de [`supabase/esquema.sql`](supabase/esquema.sql) y tocá **Run**. Crea la tabla `jardines` con reglas para que cada usuario vea solo su jardín.
3. Para probar más rápido: en **Authentication → Sign In / Providers → Email**, desactivá **Confirm email** (si no, cada registro pide confirmar por mail antes de poder entrar).
4. Copiá `.env.example` como `.env.local` y completá la **Project URL** y la **publishable key** (o *anon key*) que están en **Project Settings → API Keys**. Nunca uses la *secret key* en la app.
5. Volvé a arrancar `npx expo start` (las variables se leen al arrancar).

## Cómo funciona

- **Árboles de Uruguay:** al plantar una materia te toca uno al azar: ombú, ceibo, jacarandá, butiá o sauce llorón. Elegís el color de las flores o frutos.
- **Meta semanal:** elegís cuántas horas por semana le querés dedicar (de referencia, en la UdelaR 1 crédito ≈ 1 hora por semana, contando las clases).
- **El árbol crece** según las horas de la semana actual sobre la meta: semilla → brote → árbol que va creciendo → flores o frutos → ¡florecido! Cada lunes vuelve a la semilla.
- **Semana a semana:** en cada materia se ven las semanas anteriores con sus horas y si se cumplió la meta.
- **Racha 🔥:** días seguidos con al menos un minuto de estudio.
- **El cronómetro guarda la hora de inicio**, no un contador, así no se pierde tiempo si se cierra la app o se recarga la página.
- **Cuentas e invitado:** como invitado, los datos quedan en el dispositivo (localStorage en web, SQLite en el celular). Con cuenta, además se guardan en Supabase. Si creás una cuenta o entrás después de usar la app como invitado, tus árboles se pasan a la cuenta. Si estuviste sin conexión, gana la versión más nueva.

## Estructura

```
src/
  app/                    Pantallas (Expo Router: cada archivo es una ruta)
    _layout.tsx           Tipografía, proveedores y navegación
    index.tsx             El jardín: todos los árboles, progreso de la semana y materias
    materia/[id].tsx      Una materia: su árbol, el cronómetro y el historial
    nueva.tsx             Plantar una materia
    estudiar.tsx          Elegir qué estudiar (botón del medio)
    bienvenida.tsx        Primera pantalla: crear cuenta, entrar o invitado
    entrar.tsx, registro.tsx, cuenta.tsx
  components/
    arbol.tsx             Los 5 árboles (SVG), según la especie y el progreso
    escena.tsx            Cielo, nubes y colinas de fondo
    barra-inferior.tsx    Barra de abajo con el botón de Estudiar
    texto.tsx, boton.tsx, campo.tsx, panel.tsx, tarjeta-dato.tsx, fila-materia.tsx, ...
  lib/
    brote.ts              Tipos y cálculos (semanas, progreso, racha, formatos)
    especies.ts           Las especies de árboles
    almacenamiento.ts     Guardar datos en iOS/Android (y .web.ts para web)
    supabase.ts, nube.ts  Conexión con Supabase
  state/
    cuenta.tsx            Sesión: entrar, registrarse, invitado, salir
    jardin.tsx            Materias, sesiones y sincronización con la nube
  hooks/use-ahora.ts      Reloj que se actualiza solo
supabase/esquema.sql      Tabla y reglas de seguridad
```

## Antes de subir cambios

```bash
npx tsc --noEmit
npx expo lint
```
