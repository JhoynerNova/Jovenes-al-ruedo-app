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
  Modal,
  FlatList,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { registerSchema, RegisterFormData, ARTISTIC_AREAS } from '../utils/validationSchemas';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { registerUser } from '../services/api';
import { customAlert } from '../utils/alert';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'artista',
      fullName: '',
      email: '',
      age: 18,
      artisticArea: '',
      sector: '',
      password: '',
      confirmPassword: '',
    },
  });

  const selectedRole = watch('role') || 'artista';
  const selectedArea = watch('artisticArea');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      await registerUser(data);
      const isArtist = data.role === 'artista';
      customAlert(
        '¡Registro Exitoso!',
        isArtist
          ? 'Tu cuenta como joven artista ha sido creada de forma exitosa.'
          : 'Tu cuenta como empresa ha sido creada de forma exitosa.',
        [{ text: 'Iniciar Sesión', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      const errorMsg = err.message || 'Error al completar el registro';
      customAlert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArea = (area: string) => {
    setValue('artisticArea', area, { shouldValidate: true });
    setModalVisible(false);
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
            <Text style={styles.formTitle}>
              {selectedRole === 'artista' ? 'Registro de Artista' : 'Registro de Empresa'}
            </Text>
            <Text style={styles.formSubtitle}>
              {selectedRole === 'artista'
                ? 'Únete a la red cultural más grande'
                : 'Encuentra y conecta con el mejor talento joven'}
            </Text>

            {/* Selector de Rol */}
            <View style={styles.roleContainer}>
              <TouchableOpacity
                style={[styles.roleBtn, selectedRole === 'artista' && styles.roleBtnActive]}
                onPress={() => setValue('role', 'artista', { shouldValidate: true })}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={selectedRole === 'artista' ? '#FFFFFF' : '#CBD5E1'}
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleBtnText, selectedRole === 'artista' && styles.roleBtnTextActive]}>
                  Artista
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleBtn, selectedRole === 'empresa' && styles.roleBtnActive]}
                onPress={() => setValue('role', 'empresa', { shouldValidate: true })}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={selectedRole === 'empresa' ? '#FFFFFF' : '#CBD5E1'}
                  style={styles.roleIcon}
                />
                <Text style={[styles.roleBtnText, selectedRole === 'empresa' && styles.roleBtnTextActive]}>
                  Empresa
                </Text>
              </TouchableOpacity>
            </View>

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label={selectedRole === 'artista' ? 'Nombre Completo' : 'Nombre de la Empresa'}
                  placeholder={selectedRole === 'artista' ? 'Tu nombre completo' : 'Nombre de la empresa'}
                  iconName={selectedRole === 'artista' ? 'person-outline' : 'business-outline'}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.fullName?.message}
                />
              )}
            />

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

            {selectedRole === 'artista' ? (
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <Controller
                    control={control}
                    name="age"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <CustomInput
                        label="Edad"
                        placeholder="18"
                        keyboardType="numeric"
                        iconName="calendar-outline"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value?.toString() || ''}
                        error={errors.age?.message}
                      />
                    )}
                  />
                </View>

                <View style={styles.halfWidth}>
                  <Text style={[styles.label, !!errors.artisticArea && styles.labelError]}>Área Artística</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={[
                      styles.selectorButton,
                      !!selectedArea && styles.selectorActive,
                      !!errors.artisticArea && styles.selectorError,
                    ]}
                  >
                    <Ionicons name="color-palette-outline" size={20} color={errors.artisticArea ? '#F2994A' : '#A0AEC0'} style={styles.selectorIcon} />
                    <Text style={[styles.selectorText, !selectedArea && styles.selectorPlaceholder]}>
                      {selectedArea || 'Seleccionar'}
                    </Text>
                    <Ionicons name="chevron-down-outline" size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                  {errors.artisticArea && (
                    <Text style={styles.errorText}>{errors.artisticArea.message}</Text>
                  )}
                </View>
              </View>
            ) : (
              <Controller
                control={control}
                name="sector"
                render={({ field: { onChange, onBlur, value } }) => (
                  <CustomInput
                    label="Sector de la Industria"
                    placeholder="Ej. Diseño, Música, Publicidad..."
                    iconName="briefcase-outline"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    error={errors.sector?.message}
                  />
                )}
              />
            )}

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

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomInput
                  label="Confirmar Contraseña"
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
              title="Registrar Cuenta"
              onPress={handleSubmit(onSubmit)}
              isLoading={loading}
              variant="accent"
              style={styles.submitBtn}
            />
          </View>

          {/* Modal dropdown simulation for Artistic Areas */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Selecciona tu Área Artística</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close-outline" size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={ARTISTIC_AREAS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.areaItem,
                        selectedArea === item && styles.areaItemActive,
                      ]}
                      onPress={() => handleSelectArea(item)}
                    >
                      <Text style={[styles.areaItemText, selectedArea === item && styles.areaItemTextActive]}>
                        {item}
                      </Text>
                      {selectedArea === item && (
                        <Ionicons name="checkmark-sharp" size={20} color="#2EC4B6" />
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                />
              </View>
            </View>
          </Modal>

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
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#CBD5E1',
    marginBottom: 24,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  roleBtnActive: {
    backgroundColor: '#5A3FA0',
  },
  roleIcon: {
    marginRight: 6,
  },
  roleBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  labelError: {
    color: '#F2994A',
  },
  selectorButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  selectorActive: {
    borderColor: '#5A3FA0',
    backgroundColor: 'rgba(90, 63, 160, 0.05)',
  },
  selectorError: {
    borderColor: '#F2994A',
    backgroundColor: 'rgba(242, 153, 74, 0.05)',
  },
  selectorIcon: {
    marginRight: 6,
  },
  selectorText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    color: '#A0AEC0',
    fontWeight: '400',
  },
  errorText: {
    color: '#F2994A',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#2E1F5B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    maxHeight: '75%',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    marginBottom: 16,
  },
  areaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  areaItemActive: {
    backgroundColor: 'rgba(90, 63, 160, 0.2)',
  },
  areaItemText: {
    fontSize: 16,
    color: '#E2E8F0',
  },
  areaItemTextActive: {
    color: '#2EC4B6',
    fontWeight: '700',
  },
});
