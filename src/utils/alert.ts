import { Alert as RNAlert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Módulo de alertas multiplataforma compatible con Web y Móvil.
 * Evita bloqueos y excepciones de ejecución en React Native Web.
 */
export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (Platform.OS === 'web') {
    const fullMessage = message ? `${title}\n\n${message}` : title;
    window.alert(fullMessage);
    
    // Si hay un botón con callback, lo ejecutamos inmediatamente al cerrar la alerta
    if (buttons && buttons.length > 0) {
      const primaryButton = buttons[0];
      if (primaryButton.onPress) {
        primaryButton.onPress();
      }
    }
  } else {
    RNAlert.alert(title, message, buttons);
  }
};
