import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Aviso", "Ingresa tu usuario y contraseña");
      return;
    }

    setIsLoading(true);

    try {
      // Donde va la URL del backend
      const response = await fetch('url aquí', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        // Donde se guarda el JWT
        await login(data.token); 
      } else {
        Alert.alert("Error", data.message || "Credenciales incorrectas");
      }
    } catch (error) {
      // Para pruebas
      await login("token_de_prueba_123"); 
      Alert.alert("Error de conexión", "No se pudo conectar al servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <Text style={styles.title}>Cultiva App</Text>
      <Text style={styles.subtitle}>Panel de Invernadero</Text>
      
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Correo o ID"
          placeholderTextColor="#8A95A5"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#8A95A5"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontFamily: 'Lato_700Bold', fontSize: 36, color: '#2C3E50', marginBottom: 5 },
  subtitle: { fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2ECC71', marginBottom: 40 },
  formContainer: { width: '100%', maxWidth: 350 },
  input: {
    backgroundColor: '#F9FDFA', padding: 15, borderRadius: 12, marginBottom: 15,
    fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2C3E50',
    borderWidth: 1, borderColor: 'rgba(44, 62, 80, 0.1)'
  },
  button: { backgroundColor: '#2ECC71', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 18 }
});