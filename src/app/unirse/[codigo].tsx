import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Arbol } from '@/components/arbol';
import { Boton } from '@/components/boton';
import { Campo } from '@/components/campo';
import { Encabezado } from '@/components/encabezado';
import { Panel } from '@/components/panel';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, ColoresFlor, Espacio } from '@/constants/theme';
import { nombreVisible, useMisGrupos } from '@/hooks/use-grupos';
import { guardar, quitar } from '@/lib/almacenamiento';
import { CLAVE_INVITACION, infoInvitacion, mensajeGrupos, unirseGrupo, type Invitacion } from '@/lib/grupos';
import { useCuenta } from '@/state/cuenta';
import { useJardin } from '@/state/jardin';

const NUEVA = '__nueva__';
const soloDigitos = (texto: string) => texto.replace(/[^0-9]/g, '');

/** Se abre con el link de invitación: muestra el grupo y te deja sumarte con una de tus materias. */
export default function Unirse() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const router = useRouter();
  const { estado, usuario, nubeDisponible } = useCuenta();
  const { materias, agregarMateria } = useJardin();
  const { grupos } = useMisGrupos();

  const [invitacion, setInvitacion] = useState<{ codigo: string; datos: Invitacion | null; error: string | null } | null>(
    null,
  );
  const [elegida, setElegida] = useState<string | null>(null);
  const [horas, setHoras] = useState('4');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pedir los datos de la invitación (funciona sin cuenta).
  useEffect(() => {
    if (!nubeDisponible) return;
    let vigente = true;
    infoInvitacion(codigo)
      .then((datos) => vigente && setInvitacion({ codigo, datos, error: null }))
      .catch((e) => vigente && setInvitacion({ codigo, datos: null, error: mensajeGrupos(e) }));
    return () => {
      vigente = false;
    };
  }, [codigo, nubeDisponible]);

  const datos = invitacion?.codigo === codigo ? invitacion : null;
  const grupo = datos?.datos ?? null;
  const conectado = estado === 'conectado';

  // Si ya estás en el grupo, directo al grupo.
  if (conectado && grupo && grupos?.some((g) => g.id === grupo.id)) {
    quitar(CLAVE_INVITACION);
    return <Redirect href={{ pathname: '/grupo/[id]', params: { id: grupo.id } }} />;
  }

  // Sin cuenta: se guarda la invitación para volver acá después de entrar o registrarse.
  const irACuenta = (ruta: '/registro' | '/entrar') => {
    guardar(CLAVE_INVITACION, codigo);
    router.push(ruta);
  };

  // Por defecto: una materia con el mismo nombre que el grupo, o crear una nueva.
  const sugerida = grupo
    ? materias.find((m) => m.nombre.trim().toLowerCase() === grupo.nombre.trim().toLowerCase())?.id
    : undefined;
  const seleccion = elegida ?? sugerida ?? (materias.length > 0 ? materias[0].id : NUEVA);
  const horasNum = Number.parseInt(horas, 10);
  const valido = seleccion !== NUEVA || horasNum > 0;

  const unirme = async () => {
    if (!grupo || !valido || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const materiaId =
        seleccion === NUEVA
          ? agregarMateria({
              nombre: grupo.nombre,
              metaSemanal: horasNum,
              color: ColoresFlor[materias.length % ColoresFlor.length],
            }).id
          : seleccion;
      const grupoId = await unirseGrupo(codigo, materiaId, nombreVisible(usuario));
      quitar(CLAVE_INVITACION);
      router.replace({ pathname: '/grupo/[id]', params: { id: grupoId } });
    } catch (e) {
      setError(mensajeGrupos(e));
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="Invitación" claro />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          {!nubeDisponible || (datos && !grupo) ? (
            <Panel titulo="Invitación no válida">
              <Texto color={Colores.blanco}>
                {datos?.error ?? 'Esa invitación no existe o el grupo se borró. Pedile a quien te invitó un link nuevo.'}
              </Texto>
              <Boton titulo="Ir a Brote" variante="claro" onPress={() => router.replace('/')} />
            </Panel>
          ) : !grupo ? (
            <Texto color={Colores.blancoSuave} style={estilos.centrado}>
              Buscando la invitación…
            </Texto>
          ) : (
            <>
              <View style={estilos.encabezadoGrupo}>
                <Texto style={estilos.emoji}>👥</Texto>
                <Texto variante="titulo" color={Colores.blanco} style={estilos.centrado}>
                  Te invitaron a “{grupo.nombre}”
                </Texto>
                <Texto color={Colores.blancoSuave} style={estilos.centrado}>
                  {grupo.miembros === 1 ? '1 persona estudia' : `${grupo.miembros} personas estudian`} en este grupo.
                  Sumate y compitan por horas de estudio.
                </Texto>
              </View>

              {!conectado ? (
                <Panel
                  titulo="Para sumarte necesitás una cuenta"
                  subtitulo="Si ya venías usando Brote como invitado, tus árboles se pasan a la cuenta.">
                  <Boton titulo="Crear cuenta" onPress={() => irACuenta('/registro')} />
                  <Boton titulo="Ya tengo cuenta" variante="claro" onPress={() => irACuenta('/entrar')} />
                </Panel>
              ) : (
                <Panel
                  titulo="¿Con cuál de tus materias?"
                  subtitulo="Las horas que estudies en esa materia van a contar en el ranking del grupo.">
                  {materias.map((m) => (
                    <Opcion key={m.id} elegida={seleccion === m.id} onPress={() => setElegida(m.id)}>
                      <View style={estilos.arbolito}>
                        <Arbol especie={m.especie} progreso={0.7} color={m.color} semilla={m.id} tamano={34} />
                      </View>
                      <Texto variante="subtitulo" color={Colores.blanco} numberOfLines={1} style={estilos.flex}>
                        {m.nombre}
                      </Texto>
                    </Opcion>
                  ))}
                  <Opcion elegida={seleccion === NUEVA} onPress={() => setElegida(NUEVA)}>
                    <Texto style={estilos.mas}>＋</Texto>
                    <Texto variante="subtitulo" color={Colores.blanco} numberOfLines={1} style={estilos.flex}>
                      Plantar “{grupo.nombre}”
                    </Texto>
                  </Opcion>
                  {seleccion === NUEVA && (
                    <Campo
                      etiqueta="Horas por semana"
                      value={horas}
                      onChangeText={(t) => setHoras(soloDigitos(t))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  )}
                  {error && (
                    <Texto variante="chico" color="#FFE08A">
                      ⚠️ {error}
                    </Texto>
                  )}
                  <Boton
                    titulo={enviando ? 'Uniéndote…' : '👥 Unirme al grupo'}
                    vibracion="media"
                    onPress={unirme}
                    deshabilitado={!valido || enviando}
                  />
                </Panel>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Opcion({ elegida, onPress, children }: { elegida: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida }}
      onPress={onPress}
      style={[estilos.opcion, elegida && estilos.opcionElegida]}>
      {children}
      <Texto variante="subtitulo" color={elegida ? Colores.amarillo : Colores.blancoSuave}>
        {elegida ? '●' : '○'}
      </Texto>
    </Pressable>
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
    gap: Espacio.l,
  },
  centrado: {
    textAlign: 'center',
  },
  encabezadoGrupo: {
    alignItems: 'center',
    gap: Espacio.s,
  },
  emoji: {
    fontSize: 48,
    lineHeight: 56,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacio.m - 4,
    padding: Espacio.s + 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  opcionElegida: {
    borderColor: Colores.amarillo,
  },
  arbolito: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  mas: {
    width: 40,
    textAlign: 'center',
    fontSize: 24,
    color: Colores.blanco,
  },
  flex: {
    flex: 1,
  },
});
