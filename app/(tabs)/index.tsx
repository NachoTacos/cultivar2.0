import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

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
  const [weatherData, setWeatherData] = useState({ temp: '--', condition: 'Consultando...', icon: 'weather-partly-cloudy' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 1. Subrutina del Clima (OpenWeatherMap)
  const fetchWeather = async () => {
    const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY; 
    
    if (!OPENWEATHER_API_KEY) {
      console.error("Anomalía: Llave de OpenWeatherMap no detectada en el entorno.");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?q=Durango,MX&units=metric&lang=es&appid=${OPENWEATHER_API_KEY}`;

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        
        let weatherIcon = 'weather-partly-cloudy';
        const mainWeather = data.weather[0].main;
        if (mainWeather === 'Clear') weatherIcon = 'weather-sunny';
        if (mainWeather === 'Clouds') weatherIcon = 'weather-cloudy';
        if (mainWeather === 'Rain' || mainWeather === 'Drizzle') weatherIcon = 'weather-pouring';

        setWeatherData({
          temp: Math.round(data.main.temp).toString(),
          condition: data.weather[0].description,
          icon: weatherIcon
        });
      }
    } catch (error) {
      console.error("Anomalía al conectar con el satélite meteorológico:", error);
    }
  };

  const fetchTelemetry = async () => {
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
      }
    } catch (error) {
      console.error("Fallo de red en telemetría:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    fetchWeather();
  }, [userToken]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTelemetry();
    fetchWeather();
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

 
  const getAirQualityStatus = (co2Value: number) => {
    if (!co2Value) return { text: "N/D", color: "#8A95A5" };
    if (co2Value < 1000) return { text: "ÓPTIMA", color: "#2ECC71" }; 
    if (co2Value < 2000) return { text: "REGULAR", color: "#F39C12" }; 
    return { text: "CRÍTICA", color: "#E74C3C" }; 
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FDFA' }}>
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text style={{ marginTop: 10, fontFamily: 'Lato_400Regular', color: '#2C3E50' }}>Obteniendo telemetría...</Text>
      </View>
    );
  }

  const airQuality = getAirQualityStatus(sensorData?.air_quality);
  
  const formattedAirQuality = sensorData?.air_quality 
    ? `${airQuality.text}\n(${Math.round(sensorData.air_quality)} ppm)` 
    : airQuality.text;

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
              <Text style={styles.headerSubtitle}>Invernadero Hidropónico</Text>
            </View>
            <TouchableOpacity style={[styles.profileIconContainer, styles.shadow]} onPress={handleLogout} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={26} color="#E74C3C" />
            </TouchableOpacity>
          </View>

          <View style={[styles.telemetryBar, styles.shadow]}>
            <View style={styles.telemetryLeft}>
              <MaterialCommunityIcons name={weatherData.icon as any} size={36} color="#3498DB" />
              <View style={styles.telemetryInfo}>
                <Text style={styles.telemetryTemp}>{weatherData.temp}°C</Text>
                <Text style={styles.telemetryLabel}>Durango Ext.</Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryRight}>
              <View style={styles.telemetryRow}>
                <Ionicons name="time-outline" size={14} color="#3498DB" />
                <Text style={styles.telemetryLocation}>Última actualización</Text>
              </View>
              <Text style={styles.telemetryTime}>
                {sensorData?.timestamp ? sensorData.timestamp.split(' ')[1].substring(0, 5) : '--:--'}
              </Text>
              <Text style={styles.telemetryDate}>{weatherData.condition}</Text>
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
              iconName="leaf" 
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
  telemetryBar: { flexDirection: 'row', backgroundColor: '#F9FDFA', borderRadius: 12, paddingVertical: 15, paddingHorizontal: 15, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(52, 152, 219, 0.3)' },
  telemetryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  telemetryInfo: { marginLeft: 10 },
  telemetryTemp: { fontFamily: 'Lato_700Bold', fontSize: 28, color: '#2C3E50', lineHeight: 30 },
  telemetryLabel: { fontFamily: 'Lato_400Regular', fontSize: 12, color: '#8A95A5' },
  telemetryDivider: { width: 1, backgroundColor: 'rgba(44, 62, 80, 0.1)', marginHorizontal: 10 },
  telemetryRight: { flex: 1.2, justifyContent: 'center', alignItems: 'flex-end' },
  telemetryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  telemetryLocation: { fontFamily: 'Lato_400Regular', fontSize: 12, color: '#2C3E50', marginLeft: 4 },
  telemetryTime: { fontFamily: 'Lato_700Bold', fontSize: 20, color: '#2C3E50', marginBottom: 2 },
  telemetryDate: { fontFamily: 'Lato_400Regular', fontSize: 11, color: '#8A95A5', textTransform: 'capitalize' },
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