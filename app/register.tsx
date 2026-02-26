import React, { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, TextInput, 
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Campos incompletos", "Por favor llena todos los datos para crear tu cuenta.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://cultiva-backend.onrender.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "¡Registro Exitoso!", 
          "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
          [{ text: "Ir al Login", onPress: () => router.replace('/login') }]
        );
      } else {
        Alert.alert("Error al registrar", data.message || "El correo ya podría estar en uso.");
      }
    } catch (error) {
      Alert.alert("Error de red", "No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      {/* Añadimos 'height' para Android y 'padding' para iOS */}
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Sacamos el botón de posición absoluta para que fluya con el scroll */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={28} color="#2C3E50" />
          </TouchableOpacity>

          <View style={styles.innerFormContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete y controla tu invernadero</Text>
            
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#8A95A5" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre completo"
                  placeholderTextColor="#8A95A5"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#8A95A5" style={styles.inputIcon} />
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
                <Ionicons name="lock-closed-outline" size={20} color="#8A95A5" style={styles.inputIcon} />
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

              <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Registrarme</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                <Text style={styles.loginText}>
                  ¿Ya tienes una cuenta? <Text style={styles.loginTextBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    padding: 20 
  },
  // Ajustamos el botón de back para que empuje el contenido hacia abajo naturalmente
  backButton: {
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    alignSelf: 'flex-start',
    padding: 5,
    marginBottom: 10,
  },
  innerFormContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40, // Espacio extra para que el teclado no tape el último enlace
  },
  title: { fontFamily: 'Lato_700Bold', fontSize: 32, color: '#2C3E50', marginBottom: 5 },
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
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: '#2C3E50',
  },
  eyeIcon: { padding: 10 },
  
  button: { backgroundColor: '#2C3E50', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 10, elevation: 3 },
  buttonText: { fontFamily: 'Lato_700Bold', color: '#FFFFFF', fontSize: 18 },
  
  loginLink: { marginTop: 25, alignItems: 'center' },
  loginText: { fontFamily: 'Lato_400Regular', fontSize: 14, color: '#8A95A5' },
  loginTextBold: { fontFamily: 'Lato_700Bold', color: '#2C3E50' }
});