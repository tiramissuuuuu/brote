import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Boton } from '@/components/boton';
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

  const cerrar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const plantar = () => {
    if (!valido) return;
    agregarMateria({ nombre: nombre.trim(), metaSemanal: horasNum, color });
    cerrar();
  };

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={estilos.contenido}
      keyboardShouldPersistTaps="handled">
      <View style={estilos.columna}>
        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Nombre</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej.: Cálculo DIV"
            placeholderTextColor={Colores.textoSuave}
            style={estilos.entrada}
            autoFocus
            maxLength={60}
            returnKeyType="next"
          />
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Horas por semana</Text>
          <TextInput
            value={horas}
            onChangeText={(t) => setHoras(soloDigitos(t))}
            placeholder="Ej.: 8"
            placeholderTextColor={Colores.textoSuave}
            style={estilos.entrada}
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={estilos.ayuda}>
            Cuando llegues a estas horas en la semana, la planta florece. Cada lunes vuelve a empezar desde
            la semilla. De referencia: en la UdelaR cada crédito equivale a 15 horas de trabajo en el
            semestre, más o menos 1 hora por semana (contando las clases).
          </Text>
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Color de las flores</Text>
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
        <Boton titulo="Cancelar" variante="secundario" onPress={cerrar} />
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: Colores.fondo,
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
  etiqueta: {
    color: Colores.texto,
    fontSize: 15,
    fontWeight: '700',
  },
  entrada: {
    backgroundColor: Colores.tarjeta,
    borderWidth: 1,
    borderColor: Colores.borde,
    borderRadius: 12,
    paddingHorizontal: Espacio.m,
    paddingVertical: 12,
    fontSize: 16,
    color: Colores.texto,
  },
  ayuda: {
    color: Colores.textoSuave,
    fontSize: 13,
    lineHeight: 18,
  },
  colores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacio.m - 4,
  },
  color: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorElegido: {
    borderColor: Colores.texto,
  },
});
