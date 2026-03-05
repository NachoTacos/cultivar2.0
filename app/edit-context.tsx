import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function EditContextScreen() {
  const { userToken } = useAuth();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const [contextData, setContextData] = useState({
    location: '',
    plant: '',
    substrate: '',
    gardenType: '',
    temp_unit: 'Celsius',
    humidity_unit: '%',
    light_unit: '%',
    co2_unit: 'ppm'
  });

  useEffect(() => {
    const fetchCurrentContext = async () => {
      if (!userToken) return;
      try {
        const response = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && !data.message) {
            setContextData({
              location: data.location || '',
              plant: data.plant || '',
              substrate: data.substrate || '',
              gardenType: data.gardenType || '',
              temp_unit: data.temp_unit || 'Celsius',
              humidity_unit: data.humidity_unit || '%',
              light_unit: data.light_unit || '%',
              co2_unit: data.co2_unit || 'ppm'
            });
          }
        }
      } catch (error) {
        console.error("[EDIT DEBUG] Fallo al recuperar contexto:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentContext();
  }, [userToken]);

  const handleUpdateContext = async () => {
    if (!contextData.location || !contextData.substrate || !contextData.gardenType || !contextData.plant) {
      Alert.alert("Datos incompletos", "Ubicación, planta, sustrato y tipo de invernadero son obligatorios.");
      return;
    }

    if (!userToken) return;
    setIsSaving(true);

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(contextData)
      });

      if (!response.ok) throw new Error("Fallo al registrar la actualización en el servidor.");

      Alert.alert(
        "Actualización Completada", 
        "Los parámetros del entorno han sido reconfigurados exitosamente.",
        [{ text: "Entendido", onPress: () => router.back() }]
      );

    } catch (error: any) {
      console.error("[EDIT DEBUG] Fallo en la actualización:", error.message);
      Alert.alert("Anomalía de Enlace", "No pudimos guardar tus cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={styles.loadingText}>Recuperando parámetros del entorno...</Text>
      </View>
    );
  }

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
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={28} color="#2C3E50" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Editar Entorno</Text>
              <Text style={styles.headerSubtitle}>Ajuste manual de parámetros</Text>
            </View>

            <View style={styles.formContainer}>
              
              <Text style={styles.label}>Especie Cultivada</Text>
              <TextInput style={styles.input} value={contextData.plant} onChangeText={(t) => setContextData({...contextData, plant: t})} />

              <Text style={styles.label}>Ubicación Geográfica</Text>
              <TextInput style={styles.input} value={contextData.location} onChangeText={(t) => setContextData({...contextData, location: t})} />

              <Text style={styles.label}>Sustrato Principal</Text>
              <TextInput style={styles.input} value={contextData.substrate} onChangeText={(t) => setContextData({...contextData, substrate: t})} />

              <Text style={styles.label}>Tipo de Invernadero</Text>
              <TextInput style={styles.input} value={contextData.gardenType} onChangeText={(t) => setContextData({...contextData, gardenType: t})} />

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

              <TouchableOpacity 
                style={[styles.primaryButton, isSaving && styles.disabledButton]} 
                onPress={handleUpdateContext}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>

            </View>
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
  
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FDFA' },
  loadingText: { fontFamily: 'Lato_400Regular', fontSize: 15, color: '#8A95A5', marginTop: 15 },

  header: { marginTop: 20, marginBottom: 30, alignItems: 'center', position: 'relative', justifyContent: 'center' },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 5, zIndex: 10 },
  headerTitle: { fontFamily: 'Lato_700Bold', fontSize: 26, color: '#2C3E50', textAlign: 'center' },
  headerSubtitle: { fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2ECC71', marginTop: 4, textAlign: 'center' },
  
  formContainer: { width: '100%' },
  label: { fontFamily: 'Lato_700Bold', fontSize: 13, color: '#8A95A5', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.1)', borderRadius: 12, paddingHorizontal: 15, height: 50, fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2C3E50', marginBottom: 20 },
  
  unitsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  unitBlock: { width: '47%' },
  inputSmall: { backgroundColor: '#F9FDFA', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.1)', borderRadius: 12, paddingHorizontal: 15, height: 45, fontFamily: 'Lato_400Regular', fontSize: 15, color: '#2C3E50', textAlign: 'center' },
  
  primaryButton: { flexDirection: 'row', backgroundColor: '#2C3E50', height: 55, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  disabledButton: { backgroundColor: '#8A95A5', shadowOpacity: 0, elevation: 0 },
  primaryButtonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 16 }
});