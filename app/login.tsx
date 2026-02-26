import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter(); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Aviso", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        await login(data.token); 
      } else {
        Alert.alert("Error de acceso", data.message || "Revisa tu correo y contraseña.");
      }
    } catch (error) {
      Alert.alert("Error de red", "No se pudo conectar con el servidor.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" 
        >
          <Text style={styles.title}>CULTIVA</Text>
          <Text style={styles.subtitle}>Panel de Control Inteligente</Text>
          
          <View style={styles.formContainer}>
            

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor="#8A95A5"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>


            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#8A95A5"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword} 
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#8A95A5" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.button} 
              onPress={handleLogin} 
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Entrar al Sistema</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.registerLink}
              onPress={() => router.push('/register')}
            >
              <Text style={styles.registerText}>
                ¿No tienes una cuenta? <Text style={styles.registerTextBold}>Regístrate aquí</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  title: { fontFamily: 'Lato_700Bold', fontSize: 36, color: '#2C3E50', marginBottom: 5, letterSpacing: 2 },
  subtitle: { fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2ECC71', marginBottom: 40 },
  formContainer: { width: '100%', maxWidth: 350 },
  

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FDFA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(44, 62, 80, 0.1)',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1, 
    paddingVertical: 15,
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: '#2C3E50',
  },
  eyeIcon: {
    padding: 10, 
  },
  
  button: { backgroundColor: '#2ECC71', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 3 },
  buttonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 18 },
  
 
  registerLink: {
    marginTop: 25,
    alignItems: 'center',
  },
  registerText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 14,
    color: '#8A95A5',
  },
  registerTextBold: {
    fontFamily: 'Lato_700Bold',
    color: '#2ECC71', 
  }
});