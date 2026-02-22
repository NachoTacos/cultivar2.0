import { View, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: '#FFFFFF',
      paddingBottom: insets.bottom > 0 ? insets.bottom : 15,
      paddingTop: 15,
      justifyContent: 'space-around',
      alignItems: 'center',
    }}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName: any = 'home';
        if (route.name === 'camera') iconName = 'videocam';
        if (route.name === 'chat') iconName = 'chatbubbles';
        if (route.name === 'settings') iconName = 'settings-sharp';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={{
              flex: 1, 
              alignItems: 'center',
            }}
          >
            <View style={{
              backgroundColor: isFocused ? '#2ECC71' : 'transparent',
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 10,
              overflow: 'hidden',
            }}>
              <Ionicons 
                name={iconName} 
                size={26} 
                color={isFocused ? '#FFFFFF' : '#2C3E50'} 
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="camera" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}