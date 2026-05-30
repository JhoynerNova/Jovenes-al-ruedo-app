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
import { resetPasswordSchema, ResetPasswordFormData } from '../utils/validationSchemas';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { resetPassword } from '../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const email = route.params?.email || '';
  const prefilledToken = route.params?.token || '';

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: prefilledToken,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      await resetPassword(data);
      Alert.alert(
        'Contraseña Restablecida',
        'Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.',
        [{ text: 'Ir al Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Error al restablecer la contraseña';
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
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword', { email })} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#FFFFFF" />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva Contraseña</Text>
            <Text style={styles.formSubtitle}>
              Ingresa el código enviado a tu correo {email && `(${email})`} y tu nueva contraseña segura.
            </Text>

            <Controller
              control={control}
              name="token"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Código de Verificación"
                  placeholder="Ej: 123456"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  iconName="key-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.token?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Nueva Contraseña"
                  placeholder="********"
                  isPassword
                  autoCapitalize="none"
                  iconName="lock-closed-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Confirmar Nueva Contraseña"
                  placeholder="********"
                  isPassword
                  autoCapitalize="none"
                  iconName="checkmark-circle-outline"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                />
              )}
            />

            <CustomButton
              title="Restablecer Contraseña"
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              variant="accent"
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
