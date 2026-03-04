import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from '../context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="prehled" />
          <Stack.Screen name="sluzby" />
          <Stack.Screen name="provoz" />
        </Stack>
      </GestureHandlerRootView>
    </AppProvider>
  );
}
