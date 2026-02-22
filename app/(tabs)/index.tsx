import React, { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../context/AuthContext';

// Tarjetas del Grid
const InfoCard = ({ iconName, iconFamily, title, value, valueColor = '#2C3E50' }: any) => {
  const IconComponent = iconFamily === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
  
  return (
    <View style={[styles.card, styles.shadow]}>
      <IconComponent name={iconName} size={28} color="#2C3E50" style={{ marginBottom: 12 }} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
};

export default function HomeScreen() {
  // Extraemos el JWT y la función para cerrar sesión
  const { userToken, logout } = useAuth();

  useEffect(() => {
    const fetchDatosInvernadero = async () => {
      try {
        const response = await fetch('https://apigenerica/invernadero/datos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}` 
          }
        });
        
        const data = await response.json();
        console.log("Datos recibidos del servidor:", data);
        

      } catch (error) {
        console.error("Error obteniendo datos:", error);
      }
    };

    if (userToken) {
      fetchDatosInvernadero();
    }
  }, [userToken]);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que deseas salir del panel?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: logout }
      ]
    );
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Panel de Control</Text>
              <Text style={styles.headerSubtitle}>Invernadero Hidropónico</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.profileIconContainer, styles.shadow]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={26} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          <View style={[styles.telemetryBar, styles.shadow]}>
            <View style={styles.telemetryLeft}>
              <MaterialCommunityIcons name="weather-pouring" size={36} color="#3498DB" />
              <View style={styles.telemetryInfo}>
                <Text style={styles.telemetryTemp}>-1°C</Text>
                <Text style={styles.telemetryLabel}>Clima Exterior</Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryRight}>
              <View style={styles.telemetryRow}>
                <Ionicons name="location-sharp" size={14} color="#3498DB" />
                <Text style={styles.telemetryLocation}>Durango, México.</Text>
              </View>
              <Text style={styles.telemetryTime}>6:57 A.M.</Text>
              <Text style={styles.telemetryDate}>Mar, 27 Enero 2026</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Parámetros Internos</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>En línea</Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <InfoCard 
              iconName="weather-windy" 
              iconFamily="MaterialCommunityIcons"
              title="Calidad del aire" 
              value="MALA" 
              valueColor="#E74C3C" 
            />
            <InfoCard 
              iconName="water-outline" 
              iconFamily="Ionicons"
              title="Humedad" 
              value="45%" 
            />
            <InfoCard 
              iconName="thermometer-outline" 
              iconFamily="Ionicons"
              title="Temperatura" 
              value="35%" 
            />
            <InfoCard 
              iconName="sunny-outline" 
              iconFamily="Ionicons"
              title="Irradiación Solar" 
              value="20 W/M2" 
            />
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  shadow: {
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
  headerTitle: { fontFamily: 'Lato_700Bold', fontSize: 24, color: '#2C3E50' },
  headerSubtitle: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#2ECC71', marginTop: 2 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  
  telemetryBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FDFA',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(52, 152, 219, 0.3)',
  },
  telemetryLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryInfo: { marginLeft: 10 },
  telemetryTemp: { fontFamily: 'Lato_700Bold', fontSize: 28, color: '#2C3E50', lineHeight: 30 },
  telemetryLabel: { fontFamily: 'Lato_400Regular', fontSize: 12, color: '#8A95A5' },
  
  telemetryDivider: {
    width: 1,
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    marginHorizontal: 10,
  },
  
  telemetryRight: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  telemetryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  telemetryLocation: { fontFamily: 'Lato_400Regular', fontSize: 12, color: '#2C3E50', marginLeft: 4 },
  telemetryTime: { fontFamily: 'Lato_700Bold', fontSize: 20, color: '#2C3E50', marginBottom: 2 },
  telemetryDate: { fontFamily: 'Lato_400Regular', fontSize: 11, color: '#8A95A5' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontFamily: 'Lato_700Bold', fontSize: 18, color: '#2C3E50' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71', marginRight: 5 },
  statusText: { fontFamily: 'Lato_700Bold', fontSize: 11, color: '#2ECC71' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#F9FDFA', width: '47%', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontFamily: 'Lato_700Bold', fontSize: 12, color: '#8A95A5', marginBottom: 10, textAlign: 'center' },
  cardValue: { fontFamily: 'Lato_700Bold', fontSize: 22 }
});