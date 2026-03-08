import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from 'expo-router';

const InfoCard = ({ iconName, iconFamily, title, value, valueColor = '#2C3E50' }: any) => {
  const IconComponent = iconFamily === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
  return (
    <View style={[styles.card, styles.shadow]}>
      <IconComponent name={iconName} size={28} color="#2C3E50" style={{ marginBottom: 12 }} />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={[styles.cardValue, { color: valueColor, textAlign: 'center' }]}>{value}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const { userToken, logout } = useAuth();
  
  const [sensorData, setSensorData] = useState<any>(null);
  const [contextData, setContextData] = useState<any>(null);
  
  const [loadingTelemetry, setLoadingTelemetry] = useState(true);
  const [loadingContext, setLoadingContext] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContext = useCallback(async (isManualRefresh = false) => {
    if (!userToken) return;
    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && !data.message) { 
          setContextData(data);
        }
      } else if (isManualRefresh) {
        Alert.alert("Error de red", `No fue posible sincronizar los datos de tu invernadero. (Código: ERR-CTX-${response.status})`);
      }
    } catch (error) {
      if (isManualRefresh) {
        Alert.alert("Error de Conexión", "Verifique su acceso a internet. El servidor no responde. (Código: ERR-CTX-NET)");
      }
    } finally {
      setLoadingContext(false);
    }
  }, [userToken]);

  const fetchTelemetry = useCallback(async (isManualRefresh = false) => {
    if (!userToken) return;
    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens?display=4', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSensorData(data[0]);
        }
      } else if (isManualRefresh) {
        Alert.alert("Falla de Sensores", `No se logró contactar con el hardware físico del invernadero. (Código: ERR-TLM-${response.status})`);
      }
    } catch (error) {
      if (isManualRefresh) {
        Alert.alert("Error de Conexión", "No se pudo recuperar la telemetría en vivo. (Código: ERR-TLM-NET)");
      }
    } finally {
      setLoadingTelemetry(false);
      setRefreshing(false);
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      fetchTelemetry(false);
      fetchContext(false);
    }, [fetchTelemetry, fetchContext])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTelemetry(true);
    fetchContext(true);
  }, [fetchTelemetry, fetchContext]);

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

  const getAirQualityStatus = (co2Value: number) => {
    if (!co2Value) return { text: "N/D", color: "#8A95A5" };
    if (co2Value < 1000) return { text: "ÓPTIMA", color: "#2ECC71" }; 
    if (co2Value < 2000) return { text: "REGULAR", color: "#F39C12" }; 
    return { text: "CRÍTICA", color: "#E74C3C" }; 
  };

  if (loadingTelemetry || loadingContext) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FDFA' }}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={{ marginTop: 10, fontFamily: 'Lato_400Regular', color: '#2C3E50' }}>Sincronizando núcleo central...</Text>
      </View>
    );
  }

  const airQuality = getAirQualityStatus(sensorData?.air_quality);
  const formattedAirQuality = sensorData?.air_quality 
    ? `${airQuality.text}\n(${Math.round(sensorData.air_quality)} ppm)` 
    : airQuality.text;

  let displayTime = '--:--:--';
  let displayDate = 'Sin conexión reciente';
  
  if (sensorData?.timestamp) {
    const parts = sensorData.timestamp.split(' ');
    if (parts.length === 2) {
      displayDate = parts[0]; 
      displayTime = parts[1]; 
    }
  }

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2ECC71']} />}
        >
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Panel de Control</Text>
              <Text style={styles.headerSubtitle}>Invernadero Automatizado</Text>
            </View>
            <TouchableOpacity style={[styles.profileIconContainer, styles.shadow]} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={26} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          <View style={[styles.telemetryBar, styles.shadow]}>
            <View style={styles.telemetryLeft}>
              <Ionicons name="leaf-outline" size={36} color="#2ECC71" />
              <View style={styles.telemetryInfo}>
                <Text style={styles.telemetryTemp} numberOfLines={1} adjustsFontSizeToFit>
                  {contextData?.plant || 'Sin Planta'}
                </Text>
                <Text style={styles.telemetryLabel}>
                  {contextData?.location || 'Ubicación Desconocida'}
                </Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryRight}>
              <View style={styles.telemetryRow}>
                <Ionicons name="sync-outline" size={14} color="#3498DB" />
                <Text style={styles.telemetryLocation}>Última Sincronización</Text>
              </View>
              <Text style={styles.telemetryTime}>{displayTime}</Text>
              <Text style={styles.telemetryDate}>{displayDate}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Parámetros Internos</Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, !sensorData && { backgroundColor: '#E74C3C' }]} />
              <Text style={[styles.statusText, !sensorData && { color: '#E74C3C' }]}>
                {sensorData ? 'En línea' : 'Desconectado'}
              </Text>
            </View>
          </View>

          <View style={styles.gridContainer}>
            <InfoCard 
              iconName="cloud-outline" 
              iconFamily="Ionicons"
              title="CO2 (SCD30)" 
              value={formattedAirQuality} 
              valueColor={airQuality.color} 
            />
            <InfoCard 
              iconName="water-outline" 
              iconFamily="Ionicons"
              title="Humedad" 
              value={sensorData?.air_humidity ? `${sensorData.air_humidity.toFixed(1)}%` : '--%'} 
            />
            <InfoCard 
              iconName="thermometer-outline" 
              iconFamily="Ionicons"
              title="Temperatura" 
              value={sensorData?.temperature ? `${sensorData.temperature.toFixed(1)}°C` : '--°C'} 
            />
            <InfoCard 
              iconName="sunny-outline" 
              iconFamily="Ionicons"
              title="Luminosidad" 
              value={sensorData?.luminosity ? `${sensorData.luminosity.toFixed(1)}%` : '--%'} 
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
  shadow: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 25 },
  headerTitle: { fontFamily: 'Lato_700Bold', fontSize: 24, color: '#2C3E50' },
  headerSubtitle: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#2ECC71', marginTop: 2 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  
  telemetryBar: { flexDirection: 'row', backgroundColor: '#F9FDFA', borderRadius: 12, paddingVertical: 18, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.3)' },
  telemetryLeft: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  telemetryInfo: { marginLeft: 10, flex: 1 },
  telemetryTemp: { fontFamily: 'Lato_700Bold', fontSize: 20, color: '#2C3E50', lineHeight: 22, textTransform: 'capitalize' },
  telemetryLabel: { fontFamily: 'Lato_400Regular', fontSize: 13, color: '#8A95A5', marginTop: 2 },
  telemetryDivider: { width: 1, backgroundColor: 'rgba(44, 62, 80, 0.1)', marginHorizontal: 15 },
  telemetryRight: { flex: 1, justifyContent: 'center', alignItems: 'flex-start' },
  telemetryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  telemetryLocation: { fontFamily: 'Lato_700Bold', fontSize: 11, color: '#3498DB', marginLeft: 4, textTransform: 'uppercase' },
  telemetryTime: { fontFamily: 'Lato_700Bold', fontSize: 18, color: '#2C3E50', marginBottom: 2 },
  telemetryDate: { fontFamily: 'Lato_400Regular', fontSize: 12, color: '#8A95A5' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontFamily: 'Lato_700Bold', fontSize: 18, color: '#2C3E50' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71', marginRight: 5 },
  statusText: { fontFamily: 'Lato_700Bold', fontSize: 11, color: '#2ECC71' },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#F9FDFA', width: '47%', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 10, alignItems: 'center', marginBottom: 15 },
  cardTitle: { fontFamily: 'Lato_700Bold', fontSize: 12, color: '#8A95A5', marginBottom: 10, textAlign: 'center' },
  cardValue: { fontFamily: 'Lato_700Bold', fontSize: 20 } 
});