import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../utils/validationSchemas';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { forgotPassword } from '../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ route, navigation }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const emailFromParam = route.params?.email || '';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: emailFromParam,
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setLoading(true);
    try {
      const res = await forgotPassword(data.email);
      
      // In mock mode, we output the token directly in the alert to make testing super easy and friendly!
      const alertMsg = res.mockToken 
        ? `Se ha enviado un código de recuperación. Para propósitos de simulación local, tu código es: ${res.mockToken}`
        : 'Se ha enviado un enlace de recuperación a tu dirección de correo electrónico.';

      Alert.alert(
        'Solicitud Enviada',
        alertMsg,
        [
          {
            text: 'Ingresar Código',
            onPress: () => navigation.navigate('ResetPassword', { email: data.email, token: res.mockToken }),
          },
        ]
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Error al solicitar la recuperación de contraseña';
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
            <Text style={styles.backText}>Volver al Login</Text>
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Recuperar Contraseña</Text>
            <Text style={styles.formSubtitle}>
              Ingresa tu correo electrónico registrado y te enviaremos un código para restablecer tu contraseña.
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Correo Electrónico"
                  placeholder="ejemplo@correo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  iconName="mail-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            <CustomButton
              title="Enviar Código de Recuperación"
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              variant="primary"
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#2E1F5B', // Brand Dark
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 24,
    marginTop: 8,
  },
});
