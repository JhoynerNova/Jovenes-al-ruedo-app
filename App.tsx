import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { useAuthStore, initializeAuthStore } from './src/stores/authStore';

export default function App(): React.JSX.Element {
  const { isLoading } = useAuthStore();

  useEffect(() => {
    // Attempt to auto-login if there is an existing session saved securely
    initializeAuthStore().catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#2EC4B6" />
        <Text style={styles.loadingText}>Cargando Jóvenes al Ruedo...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" />
      <AuthNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2E1F5B', // Brand Dark
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#2E1F5B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#CBD5E1',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
