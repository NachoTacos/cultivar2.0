import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import * as ScreenOrientation from 'expo-screen-orientation';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const { userToken } = useAuth();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<string>('--:--:--');
  
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);

  const fetchCameraFrame = useCallback(async () => {
    if (!userToken) return;

    setIsFetching(true);

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/image', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64(reader.result as string);
          
          const now = new Date();
          setLastUpdate(now.toLocaleTimeString());
          setIsFetching(false);
        };
        reader.readAsDataURL(blob);
      } else {
        console.error("[CAMERA DEBUG] Anomalía en la recepción de la imagen:", response.status);
        setIsFetching(false);
      }
    } catch (error) {
      console.error("[CAMERA DEBUG] Fallo de red al conectar con la camara:", error);
      setIsFetching(false);
    }
  }, [userToken]);

  useEffect(() => {
    fetchCameraFrame();
  }, [fetchCameraFrame]);

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

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Cámara invernadero</Text>
            <Text style={styles.headerSubtitle}>Captura del entorno</Text>
          </View>
          <View style={[styles.profileIconContainer, styles.shadow]}>
            <Ionicons name="camera-outline" size={28} color="#2C3E50" />
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.cameraFrame, styles.shadow]}>
            
            <View style={styles.viewport}>
              {imageBase64 ? (
                <TouchableOpacity style={styles.imageButton} onPress={openFullScreen} activeOpacity={0.8}>
                  <Image 
                    source={{ uri: imageBase64 }} 
                    style={styles.image} 
                    resizeMode="cover"
                  />
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

              {isFetching && !isFullScreen && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#2ECC71" />
                </View>
              )}
            </View>

            <View style={styles.cameraStatusBar}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, isFetching ? styles.dotFetching : styles.dotIdle]} />
                <Text style={styles.statusText}>
                  {isFetching ? 'DESCARGANDO...' : 'EN ESPERA UPDATE'}
                </Text>
              </View>
              <Text style={styles.timeText}>Última toma: {lastUpdate}</Text>
            </View>

          </View>

          <TouchableOpacity 
            style={[styles.refreshButton, styles.shadow, isFetching && styles.refreshButtonDisabled]} 
            onPress={fetchCameraFrame}
            activeOpacity={0.8}
            disabled={isFetching}
          >
            <Ionicons name="aperture-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.refreshButtonText}>Capturar Fotografía</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      <Modal 
        visible={isFullScreen} 
        transparent={false} 
        animationType="fade" 
        onRequestClose={closeFullScreen} 
      >
        <View style={styles.fullScreenContainer}>
          
          {imageBase64 && (
            <Image 
              source={{ uri: imageBase64 }} 
              style={styles.fullScreenImage} 
              resizeMode="contain" 
            />
          )}

          {isFetching && (
            <View style={styles.fullScreenLoadingOverlay}>
              <ActivityIndicator size="large" color="#2ECC71" />
            </View>
          )}

          <SafeAreaView style={styles.fullScreenControls} edges={['top', 'left', 'right']}>
            <TouchableOpacity style={styles.fsButton} onPress={closeFullScreen}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.fsButton} onPress={fetchCameraFrame} disabled={isFetching}>
              <Ionicons name="refresh" size={28} color={isFetching ? '#8A95A5' : '#FFFFFF'} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 15, marginBottom: 25 },
  headerTitle: { fontFamily: 'Lato_700Bold', fontSize: 24, color: '#2C3E50' },
  headerSubtitle: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#2ECC71', marginTop: 2 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center' },
  
  cameraFrame: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.05)', marginBottom: 25 },
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

  refreshButton: { flexDirection: 'row', backgroundColor: '#2C3E50', width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  refreshButtonDisabled: { backgroundColor: '#8A95A5' },
  refreshButtonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 16 },

  fullScreenContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  fullScreenControls: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 25 },
  fsButton: { backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: 12, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  fullScreenLoadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1 }
});