import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../stores/authStore';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { changePassword } from '../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props): React.JSX.Element {
  const { user, logout } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const handleChangePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert('Éxito', 'Tu contraseña ha sido modificada con éxito');
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Hola, Artista!</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#F2994A" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="color-palette" size={48} color="#2EC4B6" />
          </View>
          
          <Text style={styles.fullName}>{user?.fullName || 'Artista de Jóvenes al Ruedo'}</Text>
          <Text style={styles.artisticBadge}>{user?.artisticArea || 'Disciplina Creativa'}</Text>
          
          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="mail" size={20} color="#5A3FA0" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Correo Electrónico</Text>
              <Text style={styles.infoValue}>{user?.email || 'sin-correo@ejemplo.com'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#5A3FA0" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{user?.age ? `${user.age} años` : '18 años'}</Text>
            </View>
          </View>
        </View>

        {/* Security / Actions Area */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Seguridad y Cuenta</Text>
          
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.actionRow}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(90, 63, 160, 0.15)' }]}>
                <Ionicons name="lock-open" size={20} color="#5A3FA0" />
              </View>
              <View>
                <Text style={styles.actionLabel}>Cambiar Contraseña</Text>
                <Text style={styles.actionSub}>Actualiza tus credenciales de acceso</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Showcase Badge */}
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={32} color="#2EC4B6" />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Perfil Verificado</Text>
            <Text style={styles.bannerSub}>Tu perfil cumple exactamente con los lineamientos de Jóvenes al Ruedo.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={26} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <CustomInput
                label="Contraseña Actual"
                placeholder="********"
                isPassword
                value={currentPassword}
                onChangeText={setCurrentPassword}
                iconName="lock-closed-outline"
                autoCapitalize="none"
              />

              <CustomInput
                label="Nueva Contraseña"
                placeholder="Mínimo 8 caracteres"
                isPassword
                value={newPassword}
                onChangeText={setNewPassword}
                iconName="key-outline"
                autoCapitalize="none"
              />

              <CustomInput
                label="Confirmar Nueva Contraseña"
                placeholder="********"
                isPassword
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                iconName="checkmark-circle-outline"
                autoCapitalize="none"
              />

              <CustomButton
                title="Actualizar Contraseña"
                onPress={handleChangePasswordSubmit}
                isLoading={loading}
                variant="accent"
                style={styles.modalBtn}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#2E1F5B', // Brand Dark
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2EC4B6',
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  artisticBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2EC4B6',
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    overflow: 'hidden',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  infoIcon: {
    marginRight: 16,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionSub: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(46, 196, 182, 0.25)',
    borderRadius: 20,
    padding: 16,
  },
  bannerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2EC4B6',
  },
  bannerSub: {
    fontSize: 12,
    color: '#E2E8F0',
    marginTop: 2,
    lineHeight: 16,
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
    maxHeight: '85%',
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
  modalBtn: {
    marginTop: 16,
    marginBottom: 24,
  },
});
