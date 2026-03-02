import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

// --- SUBCOMPONENTE ---
const CustomThreeWaySwitch = ({ label, currentValue, onSelect }: any) => {
  const options = ['Apagado', 'Automático', 'Encendido'];

  const getActiveColor = (option: string) => {
    if (option === 'Encendido') return '#2ECC71'; 
    if (option === 'Apagado') return '#E74C3C';   
    return '#2C3E50';                             
  };

  return (
    <View style={styles.settingBlock}>
      <Text style={styles.settingText}>{label}</Text>
      
      <View style={styles.selectorContainer}>
        {options.map((option) => {
          const isActive = currentValue === option;
          
          return (
            <TouchableOpacity
              key={option}
              activeOpacity={0.8}
              onPress={() => onSelect(option)}
              style={[
                styles.optionButton, 
                isActive && { backgroundColor: getActiveColor(option) },
                isActive && styles.activeOptionShadow
              ]}
            >
              <Text style={[
                styles.optionText, 
                isActive ? styles.activeOptionText : null
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// --- PANTALLA PRINCIPAL ---
export default function SettingsScreen() {
  const { userToken } = useAuth();

  const [systems, setSystems] = useState({
    irrigator: 'Automático',
    heater: 'Automático',
    lighting: 'Automático',
    uv: 'Automático',
    shading: 'Automático'
  });

  const [refreshing, setRefreshing] = useState(false);
  const debounceTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});
  
  // Referencia para mantener el estado actual de los sistemas siempre accesible en los temporizadores
  const currentSystemsRef = useRef(systems);
  useEffect(() => { currentSystemsRef.current = systems; }, [systems]);

  // 1. Subrutina de lectura con sondas de diagnóstico
  const fetchStatus = useCallback(async () => {
    if (!userToken) return;
    
    console.log("\n[SETTINGS DEBUG] --- Iniciando lectura de estado (GET) ---");
    
    try {
      const headers = {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      };

      // Ejecutamos ambas peticiones GET al mismo tiempo
      const [resActive, resAuto] = await Promise.all([
        fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=active', { headers }),
        fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=auto', { headers })
      ]);

      if (resActive.ok && resAuto.ok) {
        const dataActive = await resActive.json();
        const dataAuto = await resAuto.json();
        
        console.log("[SETTINGS DEBUG] Respuesta servidor (mode=active):", JSON.stringify(dataActive));
        console.log("[SETTINGS DEBUG] Respuesta servidor (mode=auto):", JSON.stringify(dataAuto));
        
        const parseCombinedStatus = (key: keyof typeof systems, currentVal: string) => {
          if (dataAuto && dataAuto[key] === true) return 'Automático';
          if (dataActive && dataActive[key] !== undefined) return dataActive[key] ? 'Encendido' : 'Apagado';
          return currentVal;
        };

        setSystems(prev => ({
          irrigator: parseCombinedStatus('irrigator', prev.irrigator),
          heater: parseCombinedStatus('heater', prev.heater),
          lighting: parseCombinedStatus('lighting', prev.lighting),
          uv: parseCombinedStatus('uv', prev.uv),
          shading: parseCombinedStatus('shading', prev.shading)
        }));
      } else {
        console.error("[SETTINGS DEBUG] Error HTTP en GET. Active:", resActive.status, "Auto:", resAuto.status);
      }
    } catch (error) {
      console.error("[SETTINGS DEBUG] Fallo de red en GET:", error);
    } finally {
      setRefreshing(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, [fetchStatus]);

// Reemplazamos el diccionario de temporizadores por un único temporizador global
  const globalDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSystemChange = (systemKey: string, newValue: string) => {
    console.log(`\n[SETTINGS DEBUG] --- Intento de cambio: ${systemKey} -> ${newValue} ---`);
    
    // Al usar la función de flecha dentro de setSystems, garantizamos tener el estado más reciente
    setSystems(prev => {
      const newState = { ...prev, [systemKey]: newValue };

      // Si el usuario toca otro botón rápido, cancelamos el envío anterior
      if (globalDebounceTimer.current) {
        clearTimeout(globalDebounceTimer.current);
      }

      // Iniciamos una cuenta regresiva de 800ms antes de transmitir
      globalDebounceTimer.current = setTimeout(async () => {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        };

        // 1. Construimos un único paquete para el modo Automático
        const autoPayload = {
          irrigator: newState.irrigator === 'Automático',
          heater: newState.heater === 'Automático',
          lighting: newState.lighting === 'Automático',
          uv: newState.uv === 'Automático',
          shading: newState.shading === 'Automático'
        };

        // 2. Construimos un paquete para el modo Activo (solo con los que están manuales)
        const activePayload: Record<string, boolean> = {};
        Object.keys(newState).forEach(key => {
          const val = newState[key as keyof typeof newState];
          if (val !== 'Automático') {
            activePayload[key] = (val === 'Encendido');
          }
        });

        try {
          console.log(`[SETTINGS DEBUG] Transmitiendo paquete global mode=auto:`, JSON.stringify(autoPayload));
          const resAuto = await fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=auto', {
            method: 'PATCH', headers, body: JSON.stringify(autoPayload)
          });
          console.log(`[SETTINGS DEBUG] Estatus mode=auto:`, resAuto.status);

          // 3. Solo enviamos a mode=active si hay al menos un actuador en modo manual
          if (Object.keys(activePayload).length > 0) {
            console.log(`[SETTINGS DEBUG] Transmitiendo paquete global mode=active:`, JSON.stringify(activePayload));
            const resActive = await fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=active', {
              method: 'PATCH', headers, body: JSON.stringify(activePayload)
            });
            console.log(`[SETTINGS DEBUG] Estatus mode=active:`, resActive.status);
          }
        } catch (error: any) {
          console.error("[SETTINGS DEBUG] Fallo en la transmisión global:", error.message);
        }
      }, 800); 

      return newState; // Actualizamos la interfaz inmediatamente
    });
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
          <View style={[styles.profileIconContainer, styles.shadow]}>
            <Ionicons name="settings-outline" size={28} color="#2C3E50" />
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.settingsWrapper} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ECC71']} />
          }
        >
          <CustomThreeWaySwitch label="Sistema de Irrigación" currentValue={systems.irrigator} onSelect={(val: string) => handleSystemChange('irrigator', val)} />
          <View style={styles.divider} />
          <CustomThreeWaySwitch label="Calefacción (Heater)" currentValue={systems.heater} onSelect={(val: string) => handleSystemChange('heater', val)} />
          <View style={styles.divider} />
          <CustomThreeWaySwitch label="Iluminación Principal" currentValue={systems.lighting} onSelect={(val: string) => handleSystemChange('lighting', val)} />
          <View style={styles.divider} />
          <CustomThreeWaySwitch label="Iluminación Ultravioleta (UV)" currentValue={systems.uv} onSelect={(val: string) => handleSystemChange('uv', val)} />
          <View style={styles.divider} />
          <CustomThreeWaySwitch label="Control de Sombreado (Shading)" currentValue={systems.shading} onSelect={(val: string) => handleSystemChange('shading', val)} />
          <View style={{ height: 40 }} /> 
        </ScrollView>

      </SafeAreaView>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  header: { alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 15, marginBottom: 5 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  settingsWrapper: { paddingHorizontal: 20, paddingBottom: 20 },
  settingBlock: { paddingVertical: 18 },
  settingText: { fontFamily: 'Lato_700Bold', fontSize: 16, color: '#2C3E50', marginBottom: 15 },
  divider: { height: 1, backgroundColor: 'rgba(44, 62, 80, 0.15)', width: '100%' },
  selectorContainer: { flexDirection: 'row', backgroundColor: '#EAEAEA', borderRadius: 12, padding: 4 },
  optionButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  activeOptionShadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  optionText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: '#8A95A5' },
  activeOptionText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF' }
});