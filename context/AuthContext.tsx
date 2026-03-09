import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext<any>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isNewUser, setIsNewUser] = useState<boolean>(true);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt_invernadero');
        if (token) {
          setUserToken(token);
          setIsNewUser(true);
        }
      } catch (error) {
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
    
    setIsNewUser(true); 
    
    setIsLoading(false); 
  };

  const completeOnboarding = () => {
    setIsNewUser(false);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_invernadero');
    setUserToken(null);
    setIsNewUser(true);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, isNewUser, login, logout, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  );
}