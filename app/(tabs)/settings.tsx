import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';

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
  const router = useRouter(); // Enrutador para navegar a la edición de contexto

  // Purga del sistema "shading" del estado base
  const [systems, setSystems] = useState({
    irrigator: 'Automático',
    heater: 'Automático',
    lighting: 'Automático',
    uv: 'Automático'
  });

  const [refreshing, setRefreshing] = useState(false);
  
  const currentSystemsRef = useRef(systems);
  useEffect(() => { currentSystemsRef.current = systems; }, [systems]);

  // 1. Subrutina de lectura
  const fetchStatus = useCallback(async () => {
    if (!userToken) return;
    
    console.log("\n[SETTINGS DEBUG] --- Iniciando lectura de estado (GET) ---");
    
    try {
      const headers = {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      };

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
          uv: parseCombinedStatus('uv', prev.uv)
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

  // --- DIRECTIVA DE CICLO DE VIDA ---
  // Ejecuta la lectura cada vez que la pestaña entra en foco
  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus();
  }, [fetchStatus]);

  const globalDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // REFERENCIA: Memoria temporal para aislar solo los cambios recientes
  const pendingUpdatesRef = useRef<Record<string, string>>({});

  const handleSystemChange = (systemKey: string, newValue: string) => {
    console.log(`\n[SETTINGS DEBUG] --- Intento de cambio parcial: ${systemKey} -> ${newValue} ---`);
    
    // Actualizamos la interfaz gráfica inmediatamente para no romper la fluidez
    setSystems(prev => ({ ...prev, [systemKey]: newValue }));
    
    // Registramos el cambio exacto en la bandeja de salida
    pendingUpdatesRef.current[systemKey] = newValue;

    if (globalDebounceTimer.current) {
      clearTimeout(globalDebounceTimer.current);
    }

    // Ejecución del paquete optimizado tras 800ms
    globalDebounceTimer.current = setTimeout(async () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      };

      // Extraemos la cola de cambios y vaciamos la referencia para el futuro
      const updatesToTransmit = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {}; 

      const autoPayload: Record<string, boolean> = {};
      const activePayload: Record<string, boolean> = {};

      // Analizamos y dividimos ÚNICAMENTE los elementos que fueron modificados
      Object.keys(updatesToTransmit).forEach(key => {
        const val = updatesToTransmit[key];
        if (val === 'Automático') {
          autoPayload[key] = true;
        } else {
          autoPayload[key] = false; // Informamos al modo auto que ya no tiene control
          activePayload[key] = (val === 'Encendido'); // Informamos a active el valor de la corriente
        }
      });

      try {
        // Transmitimos solo si el objeto payload no está vacío
        if (Object.keys(autoPayload).length > 0) {
          console.log(`[SETTINGS DEBUG] PATCH Delta mode=auto:`, JSON.stringify(autoPayload));
          await fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=auto', {
            method: 'PATCH', headers, body: JSON.stringify(autoPayload)
          });
        }

        if (Object.keys(activePayload).length > 0) {
          console.log(`[SETTINGS DEBUG] PATCH Delta mode=active:`, JSON.stringify(activePayload));
          await fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=active', {
            method: 'PATCH', headers, body: JSON.stringify(activePayload)
          });
        }
      } catch (error: any) {
        console.error("[SETTINGS DEBUG] Fallo en la transmisión delta:", error.message);
      }
    }, 800); 
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
          {/* BOTÓN DE ENLACE AL NUEVO MÓDULO DE EDICIÓN DE CONTEXTO */}
          <TouchableOpacity 
            style={[styles.profileIconContainer, styles.shadow]}
            onPress={() => router.push('/edit-context')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={28} color="#2C3E50" />
          </TouchableOpacity>
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