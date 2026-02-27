import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

// --- INTERFAZ ---
interface Message {
  id: string;
  text: string;
  sender: 'ai' | 'user';
}

export default function ChatScreen() {
  const { userToken } = useAuth();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previousContext, setPreviousContext] = useState<any>(null); // Memoria positrónica
  
  const inputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: '¡Hola! Soy tu asistente de IA del invernadero. ¿Cómo está el clima allá adentro hoy o qué parámetros deseas ajustar?', sender: 'ai' }
  ]);

  const handleButtonPress = () => {
    if (inputText.trim().length === 0) {
      inputRef.current?.focus();
    } else {
      sendMessage();
    }
  };

  const sendMessage = async () => {
    if (inputText.trim().length === 0 || !userToken) return;

    const userText = inputText.trim();
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
    };

    // 1. Despliegue visual inmediato
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputText('');
    Keyboard.dismiss(); 
    setIsLoading(true);

    // 2. Construcción del paquete de datos
    const payload = {
      message: userText,
      previous: previousContext
    };

    try {
      // 3. Conexión con el núcleo de DeepSeek
      const response = await fetch('https://cultiva-backend.onrender.com/gardens/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 4. Almacenamos el JSON completo para la próxima ronda
        setPreviousContext(data);

        // 5. Mostramos la respuesta
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message || "Comando ejecutado con éxito.",
          sender: 'ai',
        };
        setMessages(prev => [...prev, aiResponse]);
      } else {
        const errorData = await response.json();
        console.error("Anomalía en el enlace neuronal:", errorData);
        
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          text: "Hubo un error de conexión con la red principal. Intenta de nuevo.", 
          sender: 'ai' 
        }]);
      }
    } catch (error) {
      console.error("Fallo crítico de red:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAI = item.sender === 'ai';

    return (
      <View style={[styles.messageWrapper, isAI ? styles.messageWrapperAI : styles.messageWrapperUser]}>
        
        {isAI && (
          <LinearGradient
            colors={['#A8FF78', '#78FFD6']} 
            style={styles.aiAvatar}
          />
        )}

        <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble, styles.shadow]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>

      </View>
    );
  };

  return (
    <LinearGradient colors={['#D5EFE0', '#FFFFFF']} style={styles.container}>
      
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={[styles.profileIconContainer, styles.shadow]}>
            <Ionicons name="person" size={28} color="#2C3E50" />
          </View>
        </View>

        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} 
        >
          
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContainer}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, styles.shadow]}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
              multiline={true}
              maxLength={250}
            />
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.shadow]} 
              onPress={handleButtonPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#2C3E50" size="small" />
              ) : (
                <Ionicons 
                  name={inputText.trim().length === 0 ? "chevron-up" : "send"} 
                  size={24} 
                  color="#2C3E50" 
                />
              )}
            </TouchableOpacity>
          </View>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: { alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 15, marginBottom: 10 },
  profileIconContainer: { backgroundColor: '#F9FDFA', padding: 8, borderRadius: 8 },
  keyboardAvoidingView: { flex: 1 },
  chatContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 15, width: '100%' },
  messageWrapperAI: { justifyContent: 'flex-start', alignItems: 'flex-start' },
  messageWrapperUser: { justifyContent: 'flex-end' },
  aiAvatar: { width: 35, height: 35, borderRadius: 17.5, marginRight: 10, marginTop: 5 },
  bubble: { maxWidth: '80%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12 },
  aiBubble: { backgroundColor: '#F4FCE3', borderTopLeftRadius: 4 },
  userBubble: { backgroundColor: '#EAEAEA', borderBottomRightRadius: 4 },
  messageText: { fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2C3E50', lineHeight: 22 },
  inputContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, alignItems: 'flex-end' },
  textInput: { flex: 1, backgroundColor: '#F9FDFA', borderRadius: 12, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12, minHeight: 45, maxHeight: 120, fontFamily: 'Lato_400Regular', fontSize: 16, color: '#2C3E50', marginRight: 10 },
  actionButton: { backgroundColor: '#EAEAEA', width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});