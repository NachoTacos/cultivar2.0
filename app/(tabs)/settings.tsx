import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect, useRouter } from 'expo-router';

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

export default function SettingsScreen() {
  const { userToken } = useAuth();
  const router = useRouter(); 

  const [systems, setSystems] = useState({
    irrigator: 'Automático',
    heater: 'Automático',
    lighting: 'Automático',
    uv: 'Automático'
  });

  const [refreshing, setRefreshing] = useState(false);
  
  const currentSystemsRef = useRef(systems);
  useEffect(() => { currentSystemsRef.current = systems; }, [systems]);

  const fetchStatus = useCallback(async (isManualRefresh = false) => {
    if (!userToken) return;
    
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
        if (isManualRefresh) {
          Alert.alert("Falla de Sincronización", `No se logró obtener el estado actual de los actuadores. (Código: ERR-SET-${resActive.status || resAuto.status})`);
        }
      }
    } catch (error) {
      if (isManualRefresh) {
        Alert.alert("Error de Conexión", "Verifique su acceso a internet. No se pudo conectar con el hardware. (Código: ERR-SET-NET)");
      }
    } finally {
      setRefreshing(false);
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      fetchStatus(false);
    }, [fetchStatus])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStatus(true);
  }, [fetchStatus]);

  const globalDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const pendingUpdatesRef = useRef<Record<string, string>>({});

  const handleSystemChange = (systemKey: string, newValue: string) => {
    setSystems(prev => ({ ...prev, [systemKey]: newValue }));
    
    pendingUpdatesRef.current[systemKey] = newValue;

    if (globalDebounceTimer.current) {
      clearTimeout(globalDebounceTimer.current);
    }

    globalDebounceTimer.current = setTimeout(async () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      };

      const updatesToTransmit = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {}; 

      const autoPayload: Record<string, boolean> = {};
      const activePayload: Record<string, boolean> = {};

      Object.keys(updatesToTransmit).forEach(key => {
        const val = updatesToTransmit[key];
        if (val === 'Automático') {
          autoPayload[key] = true;
        } else {
          autoPayload[key] = false; 
          activePayload[key] = (val === 'Encendido'); 
        }
      });

      try {
        if (Object.keys(autoPayload).length > 0) {
          const resAuto = await fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=auto', {
            method: 'PATCH', headers, body: JSON.stringify(autoPayload)
          });
          if (!resAuto.ok) throw new Error("Fallo en capa auto");
        }

        if (Object.keys(activePayload).length > 0) {
          const resActive = await fetch('https://cultiva-backend.onrender.com/gardens/activation?mode=active', {
            method: 'PATCH', headers, body: JSON.stringify(activePayload)
          });
          if (!resActive.ok) throw new Error("Fallo en capa activa");
        }
      } catch (error: any) {
        Alert.alert("Error de Transmisión", "No se pudieron aplicar los cambios en el hardware. Verifique la conexión. (Código: ERR-ACT-NET)");
        fetchStatus(false);
      }
    }, 800); 
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
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