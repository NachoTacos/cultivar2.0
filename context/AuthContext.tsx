import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext<any>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);

  // --- SUBRUTINA DE VERIFICACIÓN EXACTA ---
  const checkUserContext = async (token: string) => {
    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Extraemos el JSON sin importar si el código HTTP es 200 o de error
      const data = await response.json();
      
      // Regla estricta: Solo es usuario nuevo si el mensaje es exacto
      if (data && data.message === "Context information file is empty") {
        console.log("[AUTH DEBUG] Contexto vacío detectado. Redirigiendo a configuración inicial.");
        setIsNewUser(true);
      } else {
        console.log("[AUTH DEBUG] Contexto existente o válido detectado.");
        setIsNewUser(false);
      }

    } catch (error) {
      console.error("[AUTH DEBUG] Anomalía de red al verificar contexto:", error);
      // Mecanismo de defensa: Si la red falla o el servidor cae, asumimos que NO es nuevo 
      // para no obligarlo a reescribir su configuración por un error de conexión.
      setIsNewUser(false); 
    }
  };

  // Carga inicial al abrir la app
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt_invernadero');
        if (token) {
          setUserToken(token);
          await checkUserContext(token); 
        }
      } catch (error) {
        console.error("Error al leer el token de la memoria segura", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // Función de acceso
  const login = async (token: string) => {
    setIsLoading(true); 
    await SecureStore.setItemAsync('jwt_invernadero', token);
    setUserToken(token);
    
    // Verificamos el estado exacto en la base de datos
    await checkUserContext(token); 
    
    setIsLoading(false); 
  };

  // Función para apagar la bandera al terminar la configuración
  const completeOnboarding = () => {
    setIsNewUser(false);
  };

  // Función de salida
  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_invernadero');
    setUserToken(null);
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, isNewUser, login, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}