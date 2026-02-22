import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const AuthContext = createContext<any>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cuando la app se abre busca si hay un Token guardado
  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('jwt_invernadero');
        if (token) {
          setUserToken(token);
        }
      } catch (error) {
        console.error("Error al leer el token", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadToken();
  }, []);

  // Funcion para guardar el token
  const login = async (token: string) => {
    await SecureStore.setItemAsync('jwt_invernadero', token);
    setUserToken(token);
  };

  // Funcion para cerrar sesion
  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt_invernadero');
    setUserToken(null);
  };

  return (
    <AuthContext.Provider value={{ userToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}