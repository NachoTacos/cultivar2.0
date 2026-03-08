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

  const checkUserContext = async (token: string) => {
    try {
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/context', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data && data.message === "Context information file is empty") {
        setIsNewUser(true);
      } else {
        setIsNewUser(false);
      }

    } catch (error) {
      // Falla silenciosa: Asumimos que no es un usuario nuevo para no forzar 
      // el onboarding cada vez que haya una caída de red en el inicio.
      setIsNewUser(false); 
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt_invernadero');
        if (token) {
          setUserToken(token);
          await checkUserContext(token); 
        }
      } catch (error) {
        // Falla silenciosa en la lectura de memoria segura local
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  const login = async (token: string) => {
    setIsLoading(true); 
    await SecureStore.setItemAsync('jwt_invernadero', token);
    setUserToken(token);
    
    await checkUserContext(token); 
    
    setIsLoading(false); 
  };

  const completeOnboarding = () => {
    setIsNewUser(false);
  };

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