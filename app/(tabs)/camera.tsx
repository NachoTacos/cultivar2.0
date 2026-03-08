import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, Dimensions, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

interface AssessmentData {
  health: string;
  message: string;
  advice: string[];
}

export default function CameraScreen() {
  const { userToken } = useAuth();
  
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isFetchingCamera, setIsFetchingCamera] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isFetchingAssessment, setIsFetchingAssessment] = useState<boolean>(true);

  const fetchCameraFrame = useCallback(async (isManualRefresh = false) => {
    if (!userToken) return;
    setIsFetchingCamera(true);

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/image', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result as string);
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString());
          setIsFetchingCamera(false);
        };
        reader.readAsDataURL(blob);
      } else {
        if (isManualRefresh) {
          Alert.alert("Falla de Captura", `No se pudo obtener la imagen del invernadero. (Código: ERR-CAM-${response.status})`);
        }
        setIsFetchingCamera(false);
      }
    } catch (error) {
      if (isManualRefresh) {
        Alert.alert("Error de Conexión", "No se logró contactar con el hardware de la cámara. (Código: ERR-CAM-NET)");
      }
      setIsFetchingCamera(false);
    }
  }, [userToken]);

  const fetchAssessment = useCallback(async (isManualRefresh = false) => {
    if (!userToken) return;
    setIsFetchingAssessment(true);

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/assessment', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        
        setAssessment({
          health: data.health || "Desconocida",
          message: data.message || "",
          advice: data.advice || []
        });
      } else {
        if (isManualRefresh) {
          Alert.alert("Error de Diagnóstico", `No fue posible evaluar el estado del cultivo. (Código: ERR-ASS-${response.status})`);
        }
      }
    } catch (error) {
      if (isManualRefresh) {
        Alert.alert("Error de Red", "Verifique su acceso a internet. No se pudo conectar con la red de evaluación. (Código: ERR-ASS-NET)");
      }
    } finally {
      setIsFetchingAssessment(false);
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      fetchCameraFrame(false);
      fetchAssessment(false);
    }, [fetchCameraFrame, fetchAssessment])
  );

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const openFullScreen = async () => {
    if (!imageBase64) return;
    setIsFullScreen(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  };

  const closeFullScreen = async () => {
    setIsFullScreen(false);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  };

  const getHealthColor = (healthLevel: string) => {
    const level = healthLevel.toLowerCase();
    if (level === 'excelente') return { backgroundColor: '#27AE60' };
    if (level === 'bueno') return { backgroundColor: '#2ECC71' };
    if (level === 'moderado') return { backgroundColor: '#F39C12' };
    if (level === 'malo') return { backgroundColor: '#E74C3C' };
    return { backgroundColor: '#8A95A5' };
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Cámara Invernadero</Text>
            <Text style={styles.headerSubtitle}>Captura y análisis del entorno</Text>
          </View>
          <View style={[styles.profileIconContainer, styles.shadow]}>
            <Ionicons name="camera-outline" size={28} color="#2C3E50" />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
          
          <View style={[styles.cameraFrame, styles.shadow]}>
            <View style={styles.viewport}>
              {imageBase64 ? (
                <TouchableOpacity style={styles.imageButton} onPress={openFullScreen} activeOpacity={0.8}>
                  <Image source={{ uri: imageBase64 }} style={styles.image} resizeMode="cover" />
                  <View style={styles.expandBadge}>
                    <Ionicons name="expand" size={16} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noSignalContainer}>
                  <Ionicons name="eye-off-outline" size={48} color="#8A95A5" />
                  <Text style={styles.noSignalText}>Sin datos visuales en memoria</Text>
                </View>
              )}

              {isFetchingCamera && !isFullScreen && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#2ECC71" />
                </View>
              )}
            </View>

            <View style={styles.cameraStatusBar}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, isFetchingCamera ? styles.dotFetching : styles.dotIdle]} />
                <Text style={styles.statusText}>
                  {isFetchingCamera ? 'DESCARGANDO...' : 'EN ESPERA UPDATE'}
                </Text>
              </View>
              <Text style={styles.timeText}>Última toma: {lastUpdate}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.refreshButton, styles.shadow, isFetchingCamera && styles.refreshButtonDisabled]} 
            onPress={() => fetchCameraFrame(true)}
            activeOpacity={0.8}
            disabled={isFetchingCamera}
          >
            <Ionicons name="aperture-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.refreshButtonText}>Capturar Fotografía</Text>
          </TouchableOpacity>

          {isFetchingAssessment ? (
            <View style={styles.assessmentLoading}>
              <ActivityIndicator size="small" color="#2ECC71" />
              <Text style={styles.assessmentLoadingText}>Sincronizando diagnóstico vegetal...</Text>
            </View>
          ) : assessment ? (
            <View style={[styles.assessmentCard, styles.shadow]}>
              
              <View style={styles.assessmentHeader}>
                <Ionicons name="analytics-outline" size={24} color="#2C3E50" />
                <Text style={styles.assessmentTitle}>Estado del Cultivo</Text>
                <View style={[styles.healthBadge, getHealthColor(assessment.health)]}>
                  <Text style={styles.healthText}>{assessment.health.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.generalText}>{assessment.message}</Text>

              {assessment.advice && assessment.advice.length > 0 && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>Plan de Acción Recomendado:</Text>
                  {assessment.advice.map((tip, index) => (
                    <View key={index} style={styles.tipRow}>
                      <Ionicons name="checkmark-circle" size={20} color="#2ECC71" style={styles.tipIcon} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.assessmentCard, styles.shadow, styles.emptyAssessmentContainer]}>
              <Ionicons name="cloud-offline-outline" size={36} color="#8A95A5" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyAssessmentTitle}>Diagnóstico no disponible</Text>
              <Text style={styles.emptyAssessmentText}>El núcleo central no devolvió la evaluación agronómica al abrir la pestaña.</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={() => fetchAssessment(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color="#27AE60" style={{ marginRight: 6 }} />
                <Text style={styles.retryButtonText}>Reintentar Evaluación</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      <Modal visible={isFullScreen} transparent={false} animationType="fade" onRequestClose={closeFullScreen}>
        <View style={styles.fullScreenContainer}>
          {imageBase64 && (
            <Image source={{ uri: imageBase64 }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
          {isFetchingCamera && (
            <View style={styles.fullScreenLoadingOverlay}>
              <ActivityIndicator size="large" color="#2ECC71" />
            </View>
          )}
          <SafeAreaView style={styles.fullScreenControls} edges={['top', 'left', 'right']}>
            <TouchableOpacity style={styles.fsButton} onPress={closeFullScreen}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.fsButton} onPress={() => fetchCameraFrame(true)} disabled={isFetchingCamera}>
              <Ionicons name="refresh" size={28} color={isFetchingCamera ? '#8A95A5' : '#FFFFFF'} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 20 },
  headerTitle: { fontFamily: 'Lato_700Bold', fontSize: 24, color: '#2C3E50' },
  headerSubtitle: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#2ECC71', marginTop: 2 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  contentScroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: 'center' },
  cameraFrame: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.05)', marginBottom: 20 },
  viewport: { width: '100%', height: width * 0.75, backgroundColor: '#1A252C', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  imageButton: { flex: 1, width: '100%' },
  image: { width: '100%', height: '100%' },
  expandBadge: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: 6, borderRadius: 8 },
  noSignalContainer: { alignItems: 'center', justifyContent: 'center' },
  noSignalText: { fontFamily: 'Lato_400Regular', color: '#8A95A5', marginTop: 10, fontSize: 14 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26, 37, 44, 0.4)', justifyContent: 'center', alignItems: 'center' },
  cameraStatusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#F9FDFA' },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotIdle: { backgroundColor: '#8A95A5' }, 
  dotFetching: { backgroundColor: '#2ECC71' }, 
  statusText: { fontFamily: 'Lato_700Bold', fontSize: 11, color: '#2C3E50', letterSpacing: 0.5 },
  timeText: { fontFamily: 'Lato_400Regular', fontSize: 11, color: '#8A95A5' },
  refreshButton: { flexDirection: 'row', backgroundColor: '#2C3E50', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  refreshButtonDisabled: { backgroundColor: '#8A95A5' },
  refreshButtonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 16 },
  
  assessmentLoading: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  assessmentLoadingText: { fontFamily: 'Lato_400Regular', color: '#8A95A5', marginLeft: 10 },
  assessmentCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.05)' },
  
  emptyAssessmentContainer: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FDFEFE' },
  emptyAssessmentTitle: { fontFamily: 'Lato_700Bold', fontSize: 16, color: '#2C3E50', marginBottom: 6 },
  emptyAssessmentText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#8A95A5', textAlign: 'center', paddingHorizontal: 10, marginBottom: 20 },
  retryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.4)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { fontFamily: 'Lato_700Bold', fontSize: 14, color: '#27AE60' },

  assessmentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  assessmentTitle: { fontFamily: 'Lato_700Bold', fontSize: 18, color: '#2C3E50', marginLeft: 10, flex: 1 },
  healthBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
  healthText: { fontFamily: 'Lato_700Bold', fontSize: 12, color: '#FFFFFF' },
  generalText: { fontFamily: 'Lato_400Regular', fontSize: 15, color: '#2C3E50', lineHeight: 22, marginBottom: 18, textAlign: 'justify' },
  tipsContainer: { backgroundColor: '#F9FDFA', borderRadius: 12, padding: 15, borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.2)' },
  tipsTitle: { fontFamily: 'Lato_700Bold', fontSize: 14, color: '#27AE60', marginBottom: 12 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  tipIcon: { marginRight: 10, marginTop: 2 },
  tipText: { flex: 1, fontFamily: 'Lato_400Regular', fontSize: 14, color: '#2C3E50', lineHeight: 20 },
  fullScreenContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  fullScreenControls: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 25 },
  fsButton: { backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 12, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  fullScreenLoadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 }
});