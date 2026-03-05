import { useFonts, Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  // 1. Extraemos isNewUser del núcleo de autenticación
  const { userToken, isLoading, isNewUser } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['login', 'register'];
    const currentRoute = segments[0];

    // Lógica de enrutamiento estricto
    if (!userToken) {
      // Estado A: Sin acceso. Solo permitimos login o register.
      if (!publicRoutes.includes(currentRoute)) {
        router.replace('/login');
      }
    } 
    else {
      // Estado B: Con acceso
      if (isNewUser) {
        // Sub-estado B1: Usuario nuevo. Forzamos la entrada al Onboarding.
        if (currentRoute !== 'onboarding') {
          router.replace('/onboarding');
        }
      } else {
        // Sub-estado B2: Usuario calibrado. Bloqueamos login, register y onboarding.
        if (publicRoutes.includes(currentRoute) || currentRoute === 'onboarding') {
          router.replace('/(tabs)');
        }
      }
    }
  }, [userToken, isLoading, isNewUser, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" /> 
      {/* 2. Registramos la nueva pantalla en la pila de navegación */}
      <Stack.Screen name="onboarding" /> 
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}