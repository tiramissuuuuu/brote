import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Campo } from '@/components/campo';
import { Encabezado } from '@/components/encabezado';
import { Texto } from '@/components/texto';
import { AnchoMaximo, Colores, ColoresFlor, Espacio } from '@/constants/theme';
import { useJardin } from '@/state/jardin';

const soloDigitos = (texto: string) => texto.replace(/[^0-9]/g, '');

export default function NuevaMateria() {
  const router = useRouter();
  const { agregarMateria, materias } = useJardin();
  const [nombre, setNombre] = useState('');
  const [horas, setHoras] = useState('');
  const [color, setColor] = useState<string>(ColoresFlor[materias.length % ColoresFlor.length]);

  const horasNum = Number.parseInt(horas, 10);
  const valido = nombre.trim().length > 0 && horasNum > 0;

  const plantar = () => {
    if (!valido) return;
    const materia = agregarMateria({ nombre: nombre.trim(), metaSemanal: horasNum, color });
    router.replace({ pathname: '/materia/[id]', params: { id: materia.id, plantada: '1' } });
  };

  return (
    <View style={estilos.pantalla}>
      <Encabezado titulo="Plantar materia" icono="✕" claro />
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={estilos.columna}>
          <Texto color={Colores.blancoSuave}>
            Te va a tocar uno de estos árboles al azar: ombú, ceibo, jacarandá, butiá o sauce llorón. 🌳
          </Texto>

          <Campo
            etiqueta="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej.: Cálculo DIV"
            autoFocus
            maxLength={60}
            returnKeyType="next"
          />

          <Campo
            etiqueta="Horas por semana"
            value={horas}
            onChangeText={(t) => setHoras(soloDigitos(t))}
            placeholder="Ej.: 8"
            keyboardType="number-pad"
            maxLength={2}
            ayuda="Cuando llegues a estas horas en la semana, el árbol florece. Cada lunes vuelve a empezar desde la semilla. De referencia: en la UdelaR cada crédito equivale a 15 horas de trabajo en el semestre, más o menos 1 hora por semana (contando las clases)."
          />

          <View style={estilos.campo}>
            <Texto variante="subtitulo" color={Colores.blanco}>
              Color de las flores
            </Texto>
            <View style={estilos.colores}>
              {ColoresFlor.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: c === color }}
                  accessibilityLabel={`Color ${c}`}
                  onPress={() => setColor(c)}
                  style={[estilos.color, { backgroundColor: c }, c === color && estilos.colorElegido]}
                />
              ))}
            </View>
          </View>

          <Boton titulo="🌱 Plantar semilla" onPress={plantar} deshabilitado={!valido} />
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
    gap: Espacio.l,
  },
  campo: {
    gap: Espacio.s,
  },
  colores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.m - 4,
  },
  color: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  colorElegido: {
    borderColor: Colores.blanco,
  },
});
