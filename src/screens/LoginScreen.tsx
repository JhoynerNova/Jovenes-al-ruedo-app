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
import { AuthStackParamList } from '../types';
import { loginSchema, LoginFormData } from '../utils/validationSchemas';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { loginUser } from '../services/api';
import { useAuthStore, persistUserSession } from '../stores/authStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const { setTokens, setError } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(data);
      
      // Persist tokens in Zustand and SecureStore
      setTokens(response.access_token, response.refresh_token);
      
      // Parse user info and save session
      const userObj = {
        id: response.user.id,
        email: response.user.email,
        fullName: response.user.full_name,
        age: response.user.age,
        artisticArea: response.user.artistic_area,
      };
      await persistUserSession(userObj);

      Alert.alert(
        '¡Bienvenido!',
        `Sesión iniciada correctamente como ${userObj.fullName}`,
        [{ text: 'Aceptar', onPress: () => navigation.navigate('Dashboard') }]
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Error al iniciar sesión';
      setError(errorMsg);
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
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Jóvenes al Ruedo</Text>
            <Text style={styles.subtitle}>Conectando el arte con las oportunidades</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Iniciar Sesión</Text>
            
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

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Contraseña"
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

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword', { email: control._formValues.email })}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Iniciar Sesión"
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              variant="primary"
            />
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Aún no tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
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
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    textShadowColor: 'rgba(90, 63, 160, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    padding: 4,
  },
  forgotText: {
    color: '#2F80ED', // Brand Blue link color
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  footerLink: {
    color: '#2EC4B6', // Brand Teal link
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
