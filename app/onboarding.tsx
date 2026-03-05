import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';

export default function OnboardingScreen() {
  const { userToken, completeOnboarding, logout } = useAuth();
  
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [contextData, setContextData] = useState({
    location: '',
    substrate: '',
    gardenType: '',
    temp_unit: 'Celsius',
    humidity_unit: '%',
    light_unit: '%',
    co2_unit: 'ppm'
  });

  const [recommendedPlants, setRecommendedPlants] = useState<string[]>([]);
  const [customPlant, setCustomPlant] = useState<string>('');

  const handleContextSubmit = async () => {
    if (!contextData.location || !contextData.substrate || !contextData.gardenType) {
      Alert.alert("Datos incompletos", "Por favor, completa los campos principales de tu entorno.");
      return;
    }

    if (!userToken) return;
    setIsLoading(true);
    setStep(2); 

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      };

      console.log("[ONBOARDING DEBUG] Enviando contexto inicial:", JSON.stringify(contextData));
      
      const resContext = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
        method: 'POST',
        headers,
        body: JSON.stringify(contextData)
      });

      if (!resContext.ok) {
        const errorText = await resContext.text();
        console.error(`[ONBOARDING DEBUG CRÍTICO] HTTP Status: ${resContext.status} - Detalle: ${errorText}`);
        throw new Error("El servidor central rechazó la conexión. ¿Está encendido el invernadero físico?");
      }

      console.log("[ONBOARDING DEBUG] Solicitando recomendaciones a DeepSeek...");
      
      const resRecommends = await fetch('https://cultiva-backend.onrender.com/gardens/chat/recommends', {
        method: 'GET',
        headers
      });

      if (!resRecommends.ok) throw new Error("Anomalía al obtener recomendaciones botánicas.");

      const dataRecommends = await resRecommends.json();
      
      if (dataRecommends.plants && dataRecommends.plants.length > 0) {
        setRecommendedPlants(dataRecommends.plants);
        setStep(3); 
      } else {
        throw new Error("El modelo no devolvió una lista válida de plantas.");
      }

    } catch (error: any) {
      console.error("[ONBOARDING DEBUG] Fallo en la subrutina:", error.message);
      Alert.alert("Anomalía de Enlace", error.message);
      setStep(1); 
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlantSelection = async (selectedPlant: string) => {
    if (!selectedPlant.trim()) return;
    
    if (!userToken) return;
    setIsLoading(true);

    try {
      const payload = { 
        ...contextData, 
        plant: selectedPlant.trim() 
      };
      
      console.log("[ONBOARDING DEBUG] Enviando paquete final:", JSON.stringify(payload));

      const resFinal = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!resFinal.ok) throw new Error("Fallo al registrar la planta seleccionada.");

      console.log("[ONBOARDING DEBUG] Configuración completada con éxito.");
      completeOnboarding(); 
      router.replace('/(tabs)'); 

    } catch (error: any) {
      console.error("[ONBOARDING DEBUG] Fallo en la fase final:", error.message);
      Alert.alert("Error", "No pudimos guardar tu selección de planta.");
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.formContainer}>
      <Text style={styles.instructions}>Para calibrar la Inteligencia Artificial, describe el entorno de tu invernadero.</Text>
      
      <Text style={styles.label}>Ubicación Geográfica</Text>
      <TextInput style={styles.input} placeholder="Ej: Durango, México" placeholderTextColor="#8A95A5" value={contextData.location} onChangeText={(t) => setContextData({...contextData, location: t})} />

      <Text style={styles.label}>Sustrato Principal</Text>
      <TextInput style={styles.input} placeholder="Ej: Fibra de coco, Tierra negra..." placeholderTextColor="#8A95A5" value={contextData.substrate} onChangeText={(t) => setContextData({...contextData, substrate: t})} />

      <Text style={styles.label}>Tipo de Invernadero</Text>
      <TextInput style={styles.input} placeholder="Ej: Vertical, por goteo..." placeholderTextColor="#8A95A5" value={contextData.gardenType} onChangeText={(t) => setContextData({...contextData, gardenType: t})} />

      <View style={styles.unitsContainer}>
        <View style={styles.unitBlock}>
          <Text style={styles.label}>Unidad Temp.</Text>
          <TextInput style={styles.inputSmall} value={contextData.temp_unit} onChangeText={(t) => setContextData({...contextData, temp_unit: t})} />
        </View>
        <View style={styles.unitBlock}>
          <Text style={styles.label}>Unidad Hum.</Text>
          <TextInput style={styles.inputSmall} value={contextData.humidity_unit} onChangeText={(t) => setContextData({...contextData, humidity_unit: t})} />
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleContextSubmit}>
        <Text style={styles.primaryButtonText}>Analizar Entorno</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.plantsContainer}>
      <Text style={styles.instructions}>Basado en tu entorno, el núcleo lógico sugiere estas especies. Selecciona una o ingresa la tuya:</Text>
      
      <Text style={styles.label}>Planta a cultivar</Text>
      <View style={styles.customPlantWrapper}>
        <TextInput 
          style={styles.customPlantInput} 
          placeholder="Escribe tu propia planta..." 
          placeholderTextColor="#8A95A5" 
          value={customPlant} 
          onChangeText={setCustomPlant} 
        />
        <TouchableOpacity 
          style={[styles.customPlantButton, !customPlant.trim() && styles.customPlantButtonDisabled]} 
          onPress={() => handlePlantSelection(customPlant)}
          disabled={!customPlant.trim() || isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-sharp" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.label}>Sugerencias de la IA</Text>
      <View style={styles.chipWrapper}>
        {recommendedPlants.map((plant, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.plantChip} 
            activeOpacity={0.7}
            onPress={() => handlePlantSelection(plant)}
            disabled={isLoading}
          >
            <Ionicons name="leaf-outline" size={16} color="#2ECC71" style={{ marginRight: 6 }} />
            <Text style={styles.plantChipText}>{plant}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator size="large" color="#2ECC71" />
          <Text style={{ textAlign: 'center', marginTop: 10, color: '#8A95A5' }}>Registrando selección...</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            
            <View style={styles.header}>
              {step === 3 && (
                <TouchableOpacity 
                  style={styles.backButton} 
                  onPress={() => setStep(1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={28} color="#2C3E50" />
                </TouchableOpacity>
              )}
              <Text style={styles.headerTitle}>Bienvenido a CULTIVA</Text>
              <Text style={styles.headerSubtitle}>Configuración Inicial</Text>
            </View>

            {step === 1 && renderStep1()}
            
            {step === 2 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2C3E50" />
                <Text style={styles.loadingText}>Calculando parámetros biológicos óptimos...</Text>
              </View>
            )}

            {step === 3 && renderStep3()}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 25, paddingBottom: 40 },
  
  header: { marginTop: 20, marginBottom: 30, alignItems: 'center', position: 'relative', justifyContent: 'center' },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 5, zIndex: 10 },
  headerTitle: { fontFamily: 'Lato_700Bold', fontSize: 26, color: '#2C3E50', textAlign: 'center' },
  headerSubtitle: { fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2ECC71', marginTop: 4, textAlign: 'center' },
  
  instructions: { fontFamily: 'Lato_400Regular', fontSize: 15, color: '#2C3E50', lineHeight: 22, marginBottom: 25, textAlign: 'center' },
  
  formContainer: { width: '100%' },
  label: { fontFamily: 'Lato_700Bold', fontSize: 13, color: '#8A95A5', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.1)', borderRadius: 12, paddingHorizontal: 15, height: 50, fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2C3E50', marginBottom: 20 },
  
  unitsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  unitBlock: { width: '47%' },
  inputSmall: { backgroundColor: '#F9FDFA', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.1)', borderRadius: 12, paddingHorizontal: 15, height: 45, fontFamily: 'Lato_400Regular', fontSize: 15, color: '#2C3E50', textAlign: 'center' },
  
  primaryButton: { flexDirection: 'row', backgroundColor: '#2C3E50', height: 55, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  primaryButtonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 16 },

  logoutButton: { marginTop: 20, alignItems: 'center', padding: 10 },
  logoutButtonText: { fontFamily: 'Lato_700Bold', color: '#E74C3C', fontSize: 14 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { fontFamily: 'Lato_400Regular', fontSize: 15, color: '#8A95A5', marginTop: 20, textAlign: 'center' },

  plantsContainer: { width: '100%' },
  
  customPlantWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  customPlantInput: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.1)', borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingHorizontal: 15, height: 50, fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2C3E50' },
  customPlantButton: { backgroundColor: '#2ECC71', width: 55, height: 50, borderTopRightRadius: 12, borderBottomRightRadius: 12, justifyContent: 'center', alignItems: 'center' },
  customPlantButtonDisabled: { backgroundColor: '#8A95A5' },
  
  divider: { height: 1, backgroundColor: 'rgba(44, 62, 80, 0.1)', width: '100%', marginBottom: 20 },

  chipWrapper: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  plantChip: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#2ECC71', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  plantChipText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: '#2C3E50' }
});