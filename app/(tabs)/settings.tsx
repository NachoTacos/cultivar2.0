import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

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

  const [systems, setSystems] = useState({
    irrigator: 'Automático',
    heater: 'Automático',
    lighting: 'Automático',
    uv: 'Automático',
    shading: 'Automático'
  });

  const [refreshing, setRefreshing] = useState(false);
  const debounceTimers = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>({});

  const fetchStatus = useCallback(async () => {
    if (!userToken) return;

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/activation', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        const parseStatus = (value: boolean | undefined) => {
          if (value === true) return 'Encendido';
          if (value === false) return 'Apagado';
          return 'Automático';
        };

        setSystems(prev => ({
          ...prev,
          irrigator: data.irrigator !== undefined ? parseStatus(data.irrigator) : prev.irrigator,
          heater: data.heater !== undefined ? parseStatus(data.heater) : prev.heater,
          lighting: data.lighting !== undefined ? parseStatus(data.lighting) : prev.lighting,
          uv: data.uv !== undefined ? parseStatus(data.uv) : prev.uv,
          shading: data.shading !== undefined ? parseStatus(data.shading) : prev.shading
        }));
      } else {
        console.error("Anomalía al leer el estado de los actuadores.");
      }
    } catch (error) {
      console.error("Fallo de red en la subrutina de lectura:", error);
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

  const handleSystemChange = (systemKey: string, newValue: string) => {
    setSystems(prev => ({ ...prev, [systemKey]: newValue }));

    if (debounceTimers.current[systemKey]) {
      clearTimeout(debounceTimers.current[systemKey]);
    }

    debounceTimers.current[systemKey] = setTimeout(async () => {
      if (newValue === 'Automático') return; 

      const payload = {
        [systemKey]: newValue === 'Encendido'
      };

      try {
        const response = await fetch('https://cultiva-backend.onrender.com/gardens/activation', {
          method: 'PATCH', 
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error("Anomalía en el servidor al intentar parchear el sistema:", systemKey);
        } else {
          console.log(`Orden transmitida y confirmada: ${systemKey} -> ${newValue}`);
        }
      } catch (error) {
        console.error("Fallo de red en subrutina de parcheo:", error);
      }
    }, 500); 
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