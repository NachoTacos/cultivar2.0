import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  const [illuminationMode, setIlluminationMode] = useState('Automático');
  const [irrigationMode, setIrrigationMode] = useState('Automático');

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
          <View style={[styles.profileIconContainer, styles.shadow]}>
            <Ionicons name="person" size={28} color="#2C3E50" />
          </View>
        </View>

        <View style={styles.settingsWrapper}>
          <CustomThreeWaySwitch 
            label="Control de Iluminación"
            currentValue={illuminationMode}
            onSelect={setIlluminationMode}
          />
          <View style={styles.divider} />
          <CustomThreeWaySwitch 
            label="Control de Irrigación"
            currentValue={irrigationMode}
            onSelect={setIrrigationMode}
          />
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  shadow: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
  },
  header: { alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  settingsWrapper: { paddingHorizontal: 20 },
  settingBlock: { paddingVertical: 20 },
  settingText: { fontFamily: 'Lato_700Bold', fontSize: 16, color: '#2C3E50', marginBottom: 15 },
  divider: { height: 1, backgroundColor: 'rgba(44, 62, 80, 0.15)', width: '100%' },
  
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
    padding: 4,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeOptionShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  optionText: { fontFamily: 'Lato_400Regular', fontSize: 13, color: '#8A95A5' },
  activeOptionText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF' }
});