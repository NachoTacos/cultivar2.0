import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, Platform, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';

const PLACEHOLDER_IMAGE = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSa6e3bmsxkokkKLuuwTi9C4J45eVdGpg3nQ&s';

export default function CameraScreen() {
  const [selectedCamera, setSelectedCamera] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    setIsFullscreen(true);
  };

  const exitFullscreen = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    setIsFullscreen(false);
  };

  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const CameraFeed = ({ isFull = false }) => (
    <View style={[styles.cameraFeedContainer, isFull && styles.fullscreenFeed]}>
      <Image
        source={{ uri: PLACEHOLDER_IMAGE }}
        style={styles.cameraImage}
        resizeMode="cover"
      />
      <TouchableOpacity 
        style={styles.fullscreenButton} 
        onPress={isFull ? exitFullscreen : enterFullscreen}
      >
        <MaterialIcons 
          name={isFull ? "fullscreen-exit" : "fullscreen"} 
          size={32} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      {isFull && (
        <View style={styles.cameraLabel}>
          <Text style={styles.cameraLabelText}>Cámara {selectedCamera}</Text>
        </View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#D5EFE0" />
        <View style={styles.content}>
          
          <View style={styles.header}>
            <View style={[styles.profileIconContainer, styles.shadow]}>
              <Ionicons name="person" size={28} color="#2C3E50" />
            </View>
          </View>

          <Text style={styles.screenTitle}>Monitoreo en Vivo</Text>

          <View style={[styles.cameraPreview, styles.shadow]}>
            <CameraFeed />
          </View>

          <View style={[styles.cameraSelector, styles.shadow]}>
            <TouchableOpacity
              style={[
                styles.selectorButton,
                selectedCamera === 1 ? styles.activeButton : styles.inactiveButton
              ]}
              onPress={() => setSelectedCamera(1)}
            >
              <Text style={[
                styles.buttonText,
                selectedCamera === 1 ? styles.activeText : styles.inactiveText
              ]}>Cámara 1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.selectorButton,
                selectedCamera === 2 ? styles.activeButton : styles.inactiveButton
              ]}
              onPress={() => setSelectedCamera(2)}
            >
              <Text style={[
                styles.buttonText,
                selectedCamera === 2 ? styles.activeText : styles.inactiveText
              ]}>Cámara 2</Text>
            </TouchableOpacity>
          </View>

        </View>
      </SafeAreaView>

      <Modal
        animationType="fade"
        transparent={false}
        visible={isFullscreen}
        supportedOrientations={['landscape']}
        onRequestClose={exitFullscreen} 
      >
        <View style={styles.fullscreenContainer}>
          <StatusBar hidden={true} />
          <CameraFeed isFull={true} />
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0 },
  content: { flex: 1, paddingHorizontal: 20 },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: { alignItems: 'flex-end', marginTop: 15, marginBottom: 10 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  screenTitle: {
    fontFamily: 'Lato_700Bold',
    fontSize: 24,
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center'
  },
  cameraPreview: {
    height: 250,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#F9FDFA',
    marginBottom: 20,
  },
  cameraFeedContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  fullscreenButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.4)', 
    padding: 5,
    borderRadius: 5,
  },
  cameraSelector: {
    flexDirection: 'row',
    backgroundColor: '#F9FDFA',
    borderRadius: 12,
    padding: 5,
  },
  selectorButton: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: '#2ECC71',
  },
  inactiveButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontFamily: 'Lato_700Bold',
    fontSize: 16,
  },
  activeText: {
    color: '#FFFFFF',
  },
  inactiveText: {
    color: '#2C3E50',
  },
  
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullscreenFeed: {
    flex: 1,
    width: '100%', 
    height: '100%', 
  },
  cameraLabel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraLabelText: {
    fontFamily: 'Lato_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
  }
});