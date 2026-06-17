import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types';
import { useAuthStore } from '../stores/authStore';
import { CustomButton } from '../components/CustomButton';
import { CustomInput } from '../components/CustomInput';
import { customAlert } from '../utils/alert';
import {
  changePassword,
  getConvocatorias,
  applyToConvocatoria,
  getMisPostulaciones,
  getPortafolios,
  addPortafolioItem,
  deletePortafolioItem,
  getConversaciones,
  getMensajes,
  enviarMensaje,
  getEmpresaConvocatorias,
  crearConvocatoria,
  getPostulacionesRecibidas,
  actualizarEstadoPostulacion,
  getTodosUsuarios,
  toggleEstadoUsuario,
  getPlatformMetrics,
  eliminarConvocatoriaAdmin,
  MockConvocatoria,
  MockPostulacion,
  MockPortafolioItem,
  MockConversacion,
  MockMensaje,
} from '../services/api';

type Props = NativeStackScreenProps<AuthStackParamList, 'Dashboard'>;
type TabType = 'resumen' | 'convocatorias' | 'portafolio' | 'chat' | 'perfil' | 'candidatos' | 'usuarios';

export function DashboardScreen({ navigation }: Props): React.JSX.Element {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('resumen');

  // Shared status state
  const [loading, setLoading] = useState(false);

  // Profile - Password state
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Convocatorias state
  const [convs, setConvs] = useState<MockConvocatoria[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConv, setSelectedConv] = useState<MockConvocatoria | null>(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyCarta, setApplyCarta] = useState('');
  const [applyCvUrl, setApplyCvUrl] = useState('');
  const [selectedApplyPortId, setSelectedApplyPortId] = useState<number | null>(null);
  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const [misPostulaciones, setMisPostulaciones] = useState<MockPostulacion[]>([]);

  // Portfolio state
  const [portfolios, setPortfolios] = useState<MockPortafolioItem[]>([]);
  const [loadingPort, setLoadingPort] = useState(false);
  const [addPortModalVisible, setAddPortModalVisible] = useState(false);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortType, setNewPortType] = useState('Imagen'); // 'Imagen' | 'Audio' | 'Video' | 'Documento'
  const [newPortUrl, setNewPortUrl] = useState('');

  // Chat state
  const [conversaciones, setConversaciones] = useState<MockConversacion[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [activeChat, setActiveChat] = useState<MockConversacion | null>(null);
  const [chatMessages, setChatMessages] = useState<MockMensaje[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);

  // Empresa states
  const [empresaConvs, setEmpresaConvs] = useState<MockConvocatoria[]>([]);
  const [recibidas, setRecibidas] = useState<MockPostulacion[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<MockPostulacion | null>(null);
  const [applicantModalVisible, setApplicantModalVisible] = useState(false);
  const [createConvModalVisible, setCreateConvModalVisible] = useState(false);

  // Create job fields
  const [newConvNombre, setNewConvNombre] = useState('');
  const [newConvGlue, setNewConvGlue] = useState('');
  const [newConvExp, setNewConvExp] = useState('Sin experiencia');
  const [newConvJornada, setNewConvJornada] = useState('Tiempo Completo');
  const [newConvSalario, setNewConvSalario] = useState('');
  const [newConvUbicacion, setNewConvUbicacion] = useState('');

  // Admin states
  const [todosUsuarios, setTodosUsuarios] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalUsuarios: 0,
    totalArtistas: 0,
    totalEmpresas: 0,
    totalConvocatorias: 0,
    totalPostulaciones: 0,
  });
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Dynamic tab switcher helper
  const getTabs = () => {
    const role = user?.role || 'artista';
    if (role === 'empresa') {
      return [
        { id: 'resumen', label: 'Inicio', icon: 'home' },
        { id: 'convocatorias', label: 'Mis Vacantes', icon: 'briefcase' },
        { id: 'candidatos', label: 'Candidatos', icon: 'people' },
        { id: 'chat', label: 'Mensajes', icon: 'chatbubbles' },
        { id: 'perfil', label: 'Perfil', icon: 'person' },
      ];
    } else if (role === 'admin') {
      return [
        { id: 'resumen', label: 'Métricas', icon: 'stats-chart' },
        { id: 'usuarios', label: 'Usuarios', icon: 'people' },
        { id: 'convocatorias', label: 'Convocas', icon: 'briefcase' },
        { id: 'perfil', label: 'Perfil', icon: 'person' },
      ];
    } else {
      return [
        { id: 'resumen', label: 'Inicio', icon: 'home' },
        { id: 'convocatorias', label: 'Convocas', icon: 'briefcase' },
        { id: 'portafolio', label: 'Portafolio', icon: 'folder' },
        { id: 'chat', label: 'Mensajes', icon: 'chatbubbles' },
        { id: 'perfil', label: 'Perfil', icon: 'person' },
      ];
    }
  };

  // Reset tab to resumen if role changes
  useEffect(() => {
    const tabs = getTabs();
    const isValid = tabs.some(t => t.id === activeTab);
    if (!isValid) {
      setActiveTab('resumen');
    }
  }, [user]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const role = user?.role || 'artista';

      if (role === 'artista') {
        const c = await getConvocatorias(searchQuery);
        setConvs(c);

        const p = await getMisPostulaciones();
        setMisPostulaciones(p);
        setAppliedIds(p.map(item => item.id_conv));

        const port = await getPortafolios();
        setPortfolios(port);

        const convsList = await getConversaciones();
        setConversaciones(convsList);
      } else if (role === 'empresa') {
        const c = await getEmpresaConvocatorias(user?.fullName || '');
        setEmpresaConvs(c);

        const p = await getPostulacionesRecibidas(user?.fullName || '');
        setRecibidas(p);

        const convsList = await getConversaciones();
        setConversaciones(convsList);
      } else if (role === 'admin') {
        const m = await getPlatformMetrics();
        setMetrics(m);

        const u = await getTodosUsuarios();
        setTodosUsuarios(u);

        const c = await getConvocatorias();
        setConvs(c);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [searchQuery, user]);

  useEffect(() => {
    loadData();
  }, [loadData, activeTab]);

  const handleLogout = () => {
    customAlert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
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

  // 1. Password change submission
  const handleChangePasswordSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      customAlert('Error', 'Todos los campos son obligatorios');
      return;
    }
    if (newPassword.length < 8) {
      customAlert('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      customAlert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      customAlert('Éxito', 'Tu contraseña ha sido modificada con éxito');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      customAlert('Error', err.message || 'No se pudo cambiar la contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Empresa & Admin Handlers
  const handleUpdateStatus = async (id_i: number, status: string) => {
    try {
      await actualizarEstadoPostulacion(id_i, status);
      customAlert('Éxito', `El estado del candidato ha sido actualizado a: ${status}`);
      loadData();
    } catch (err: any) {
      customAlert('Error', err.message || 'No se pudo actualizar el estado');
    }
  };

  const handleCreateConvSubmit = async () => {
    if (!newConvNombre || !newConvGlue || !newConvSalario || !newConvUbicacion) {
      customAlert('Error', 'Todos los campos son obligatorios');
      return;
    }
    setLoading(true);
    try {
      await crearConvocatoria({
        nombre: newConvNombre,
        glue: newConvGlue,
        nivel_experiencia: newConvExp,
        tipo_jornada: newConvJornada,
        rango_salarial: newConvSalario,
        ubicacion: newConvUbicacion,
        empresa_nombre: user?.fullName || 'Empresa',
      });
      customAlert('Éxito', 'Convocatoria publicada correctamente');
      setCreateConvModalVisible(false);
      setNewConvNombre('');
      setNewConvGlue('');
      setNewConvSalario('');
      setNewConvUbicacion('');
      loadData();
    } catch (err: any) {
      customAlert('Error', err.message || 'No se pudo crear la convocatoria');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    try {
      const nextState = !currentActive;
      await toggleEstadoUsuario(userId, nextState);
      customAlert('Usuario Actualizado', `El usuario ha sido ${nextState ? 'activado' : 'desactivado'} con éxito.`);
      loadData();
    } catch (err: any) {
      customAlert('Error', err.message || 'No se pudo actualizar el usuario');
    }
  };

  const handleDeleteConvAdmin = (id_conv: number) => {
    customAlert('Eliminar Convocatoria', '¿Estás seguro de que quieres eliminar esta convocatoria por violar las normas de la plataforma?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarConvocatoriaAdmin(id_conv);
            loadData();
          } catch (err: any) {
            customAlert('Error', err.message || 'No se pudo eliminar la convocatoria');
          }
        },
      },
    ]);
  };


  // 2. Apply to convocatoria
  const handleApplySubmit = async () => {
    if (!selectedConv) return;
    setLoading(true);
    try {
      await applyToConvocatoria(selectedConv.id_conv, {
        carta_presentacion: applyCarta,
        cv_url: applyCvUrl,
        id_portafolio_interno: selectedApplyPortId,
      });
      customAlert('¡Postulación Exitosa!', `Te has inscrito correctamente a: ${selectedConv.nombre}`);
      setApplyModalVisible(false);
      setApplyCarta('');
      setApplyCvUrl('');
      setSelectedApplyPortId(null);
      setSelectedConv(null);
      loadData();
    } catch (err: any) {
      customAlert('Error', err.message || 'Error al enviar postulación');
    } finally {
      setLoading(false);
    }
  };

  // 3. Portfolio management
  const handleAddPortfolioSubmit = async () => {
    if (!newPortTitle || !newPortUrl) {
      customAlert('Error', 'Todos los campos son obligatorios');
      return;
    }
    setLoadingPort(true);
    try {
      await addPortafolioItem({
        titulo: newPortTitle,
        tipo: newPortType,
        url: newPortUrl,
      });
      customAlert('Éxito', 'Obra agregada a tu portafolio correctamente');
      setAddPortModalVisible(false);
      setNewPortTitle('');
      setNewPortUrl('');
      const port = await getPortafolios();
      setPortfolios(port);
    } catch (err: any) {
      customAlert('Error', err.message || 'Error al guardar el portafolio');
    } finally {
      setLoadingPort(false);
    }
  };

  const handleDeletePortfolioItem = (id: number) => {
    customAlert('Eliminar Obra', '¿Estás seguro de que quieres eliminar esta obra del portafolio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePortafolioItem(id);
            const port = await getPortafolios();
            setPortfolios(port);
          } catch (err: any) {
            customAlert('Error', err.message || 'No se pudo eliminar el archivo');
          }
        },
      },
    ]);
  };

  // 4. Chat interactions
  const openConversation = async (convo: MockConversacion) => {
    setActiveChat(convo);
    setChatModalVisible(true);
    setLoadingChats(true);
    try {
      const msgs = await getMensajes(convo.id_c);
      setChatMessages(msgs);
      // Mark as read mock
      convo.no_leidos = 0;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChats(false);
    }
  };

  const handleSendMessage = async () => {
    if (!activeChat || !chatInput.trim()) return;
    setSendingMsg(true);
    try {
      const sent = await enviarMensaje(activeChat.id_c, chatInput.trim());
      setChatMessages(prev => [...prev, sent]);
      setChatInput('');
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMsg(false);
    }
  };

  // RENDER SUB-VIEWS

  // View A: Resumen (Summary & Dashboard)
  const renderResumen = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerFlex}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>¡Hola, {user?.fullName?.split(' ')[0] || 'Artista'}!</Text>
            <Text style={styles.welcomeSub}>Conecta tu arte con nuevas y mejores oportunidades laborales hoy.</Text>
          </View>
          <Ionicons name="sparkles" size={40} color="#F2994A" />
        </View>
      </View>

      {/* Grid Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statCard} onPress={() => setActiveTab('portafolio')}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(46, 196, 182, 0.15)' }]}>
            <Ionicons name="folder-open-outline" size={24} color="#2EC4B6" />
          </View>
          <Text style={styles.statNumber}>{portfolios.length}</Text>
          <Text style={styles.statLabel}>Portafolios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setActiveTab('convocatorias')}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(90, 63, 160, 0.15)' }]}>
            <Ionicons name="briefcase-outline" size={24} color="#5A3FA0" />
          </View>
          <Text style={styles.statNumber}>{misPostulaciones.length}</Text>
          <Text style={styles.statLabel}>Postulado</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setActiveTab('convocatorias')}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(242, 153, 74, 0.15)' }]}>
            <Ionicons name="compass-outline" size={24} color="#F2994A" />
          </View>
          <Text style={styles.statNumber}>{convs.length}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </TouchableOpacity>
      </View>

      {/* Recommended Convocatorias */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recomendado Para Ti</Text>
        <TouchableOpacity onPress={() => setActiveTab('convocatorias')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {loadingConvs ? (
        <ActivityIndicator size="large" color="#2EC4B6" style={{ marginVertical: 20 }} />
      ) : (
        convs.slice(0, 2).map((item) => (
          <TouchableOpacity
            key={item.id_conv}
            style={styles.jobCard}
            onPress={() => {
              setSelectedConv(item);
              setApplyModalVisible(true);
            }}
          >
            <View style={styles.jobHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.nombre}</Text>
                <Text style={styles.jobCompany}>{item.empresa_nombre}</Text>
              </View>
              {appliedIds.includes(item.id_conv) && (
                <View style={styles.appliedBadge}>
                  <Text style={styles.appliedBadgeText}>Postulado</Text>
                </View>
              )}
            </View>
            <View style={styles.jobMetadata}>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#CBD5E1" />
                <Text style={styles.metaText}>{item.ubicacion}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="cash-outline" size={14} color="#CBD5E1" />
                <Text style={styles.metaText}>{item.rango_salarial}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Artist Tips Box */}
      <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Consejos Profesionales</Text>
      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={28} color="#2EC4B6" style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.tipTitle}>Destaca en las audiciones</Text>
          <Text style={styles.tipText}>Sube siempre enlaces de alta calidad en tu portafolio. Las empresas valoran mucho los audios sin ruido de fondo y videos bien iluminados.</Text>
        </View>
      </View>
    </ScrollView>
  );

  // View B: Convocatorias (Search and Apply)
  const renderConvocatorias = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={20} color="#A0AEC0" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar áreas, roles o ciudades..."
          placeholderTextColor="#A0AEC0"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {loadingConvs ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2EC4B6" />
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={(item) => item.id_conv.toString()}
          contentContainerStyle={[styles.scrollContainer, { paddingTop: 8 }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.jobCard}
              onPress={() => {
                setSelectedConv(item);
                setApplyModalVisible(true);
              }}
            >
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.nombre}</Text>
                  <Text style={styles.jobCompany}>{item.empresa_nombre}</Text>
                </View>
                {appliedIds.includes(item.id_conv) && (
                  <View style={styles.appliedBadge}>
                    <Text style={styles.appliedBadgeText}>Postulado</Text>
                  </View>
                )}
              </View>
              <Text style={styles.jobDesc} numberOfLines={2}>{item.glue}</Text>
              <View style={styles.tagRow}>
                <Text style={styles.jobTag}>{item.nivel_experiencia}</Text>
                <Text style={styles.jobTag}>{item.tipo_jornada}</Text>
              </View>
              <View style={styles.jobMetadata}>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={14} color="#CBD5E1" />
                  <Text style={styles.metaText}>{item.ubicacion}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="cash-outline" size={14} color="#CBD5E1" />
                  <Text style={styles.metaText}>{item.rango_salarial}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  // View C: Portafolio (Management)
  const renderPortafolio = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.portafolioHeader}>
        <Text style={styles.subPageTitle}>Mi Portafolio de Obras</Text>
        <TouchableOpacity style={styles.addPortBtn} onPress={() => setAddPortModalVisible(true)}>
          <Ionicons name="add-outline" size={22} color="#FFFFFF" />
          <Text style={styles.addPortBtnText}>Agregar Obra</Text>
        </TouchableOpacity>
      </View>

      {loadingPort ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2EC4B6" />
        </View>
      ) : portfolios.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="image-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
          <Text style={styles.emptyTitle}>Tu portafolio está vacío</Text>
          <Text style={styles.emptySub}>Agrega imágenes, pistas de audio o enlaces de video para que las empresas conozcan tu talento.</Text>
          <CustomButton
            title="Subir mi primer trabajo"
            onPress={() => setAddPortModalVisible(true)}
            variant="accent"
            style={{ width: '70%', marginTop: 16 }}
          />
        </View>
      ) : (
        <FlatList
          data={portfolios}
          keyExtractor={(item) => item.id_port.toString()}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'document-text-outline';
            let iconColor = '#2EC4B6';
            if (item.tipo === 'Imagen') { iconName = 'image-outline'; iconColor = '#2EC4B6'; }
            else if (item.tipo === 'Audio') { iconName = 'musical-notes-outline'; iconColor = '#F2994A'; }
            else if (item.tipo === 'Video') { iconName = 'videocam-outline'; iconColor = '#5A3FA0'; }

            return (
              <View style={styles.portfolioCard}>
                <View style={[styles.portIconContainer, { backgroundColor: `${iconColor}22` }]}>
                  <Ionicons name={iconName} size={24} color={iconColor} />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.portfolioCardTitle}>{item.titulo}</Text>
                  <Text style={styles.portfolioCardType}>{item.tipo}</Text>
                  <Text style={styles.portfolioCardUrl} numberOfLines={1}>{item.url}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeletePortfolioItem(item.id_port)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#F2994A" />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );

  // View D: Chat (Messaging)
  const renderChat = () => (
    <View style={{ flex: 1 }}>
      {loadingChats ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2EC4B6" />
        </View>
      ) : conversaciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
          <Text style={styles.emptyTitle}>Sin mensajes activos</Text>
          <Text style={styles.emptySub}>Cuando una empresa acepte tu postulación o inicie conversación, aparecerá en esta bandeja.</Text>
        </View>
      ) : (
        <FlatList
          data={conversaciones}
          keyExtractor={(item) => item.id_c}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.convoCard} onPress={() => openConversation(item)}>
              <View style={styles.convoAvatar}>
                <Ionicons name="business" size={24} color="#5A3FA0" />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <View style={styles.convoRow}>
                  <Text style={styles.convoName}>{item.nombre_empresa}</Text>
                  <Text style={styles.convoTime}>{item.fecha}</Text>
                </View>
                <Text style={styles.convoMsg} numberOfLines={1}>{item.ultimo_mensaje}</Text>
              </View>
              {item.no_leidos > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.no_leidos}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  // View E: Perfil (Security & Details)
  const renderPerfil = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
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

      {/* Security Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Seguridad y Cuenta</Text>
        <TouchableOpacity onPress={() => setPasswordModalVisible(true)} style={styles.actionRow}>
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

      {/* Verification Badge */}
      <View style={styles.banner}>
        <Ionicons name="checkmark-circle" size={32} color="#2EC4B6" />
        <View style={styles.bannerTextContainer}>
          <Text style={styles.bannerTitle}>Perfil Verificado</Text>
          <Text style={styles.bannerSub}>Tu perfil cumple exactamente con los lineamientos de Jóvenes al Ruedo.</Text>
        </View>
      </View>
    </ScrollView>
  );

  // View F: Empresa Resumen
  const renderEmpresaResumen = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerFlex}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>¡Hola, {user?.fullName || 'Empresa'}!</Text>
            <Text style={styles.welcomeSub}>Publica ofertas y conecta con los mejores artistas jóvenes del país.</Text>
          </View>
          <Ionicons name="sparkles" size={40} color="#F2994A" />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity style={styles.statCard} onPress={() => setActiveTab('convocatorias')}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(90, 63, 160, 0.15)' }]}>
            <Ionicons name="briefcase-outline" size={24} color="#5A3FA0" />
          </View>
          <Text style={styles.statNumber}>{empresaConvs.length}</Text>
          <Text style={styles.statLabel}>Convocatorias</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setActiveTab('candidatos')}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(46, 196, 182, 0.15)' }]}>
            <Ionicons name="people-outline" size={24} color="#2EC4B6" />
          </View>
          <Text style={styles.statNumber}>{recibidas.length}</Text>
          <Text style={styles.statLabel}>Postulantes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard} onPress={() => setActiveTab('chat')}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(242, 153, 74, 0.15)' }]}>
            <Ionicons name="chatbubbles-outline" size={24} color="#F2994A" />
          </View>
          <Text style={styles.statNumber}>{conversaciones.length}</Text>
          <Text style={styles.statLabel}>Chats Activos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Convocatorias Recientes</Text>
        <TouchableOpacity onPress={() => setActiveTab('convocatorias')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {empresaConvs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySub}>Aún no has publicado convocatorias.</Text>
        </View>
      ) : (
        empresaConvs.slice(0, 2).map((item) => (
          <View key={item.id_conv} style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.nombre}</Text>
                <Text style={styles.jobCompany}>{item.ubicacion}</Text>
              </View>
            </View>
            <Text style={styles.jobDesc} numberOfLines={2}>{item.glue}</Text>
            <View style={styles.jobMetadata}>
              <View style={styles.metaRow}>
                <Ionicons name="cash-outline" size={14} color="#CBD5E1" />
                <Text style={styles.metaText}>{item.rango_salarial}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color="#CBD5E1" />
                <Text style={styles.metaText}>{item.tipo_jornada}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <CustomButton
        title="Crear Nueva Convocatoria"
        onPress={() => setCreateConvModalVisible(true)}
        variant="accent"
        style={{ marginTop: 16 }}
      />
    </ScrollView>
  );

  // View G: Empresa Convocatorias
  const renderEmpresaConvocatorias = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.portafolioHeader}>
        <Text style={styles.subPageTitle}>Mis Convocatorias Publicadas</Text>
        <TouchableOpacity style={styles.addPortBtn} onPress={() => setCreateConvModalVisible(true)}>
          <Ionicons name="add-outline" size={22} color="#FFFFFF" />
          <Text style={styles.addPortBtnText}>Nueva Vacante</Text>
        </TouchableOpacity>
      </View>

      {empresaConvs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
          <Text style={styles.emptyTitle}>No tienes vacantes publicadas</Text>
          <Text style={styles.emptySub}>Publica ofertas para recibir candidaturas de los mejores talentos jóvenes.</Text>
          <CustomButton
            title="Publicar Oferta"
            onPress={() => setCreateConvModalVisible(true)}
            variant="accent"
            style={{ width: '70%', marginTop: 16 }}
          />
        </View>
      ) : (
        <FlatList
          data={empresaConvs}
          keyExtractor={(item) => item.id_conv.toString()}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item }) => (
            <View style={styles.jobCard}>
              <View style={styles.jobHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.nombre}</Text>
                  <Text style={styles.jobCompany}>{item.ubicacion} • {item.tipo_jornada}</Text>
                </View>
              </View>
              <Text style={styles.jobDesc}>{item.glue}</Text>
              <View style={styles.jobMetadata}>
                <View style={styles.metaRow}>
                  <Ionicons name="cash-outline" size={14} color="#CBD5E1" />
                  <Text style={styles.metaText}>{item.rango_salarial}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="ribbon-outline" size={14} color="#CBD5E1" />
                  <Text style={styles.metaText}>{item.nivel_experiencia}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  // View H: Empresa Candidatos
  const renderEmpresaCandidatos = () => (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <Text style={styles.subPageTitle}>Candidatos Postulados</Text>
      </View>

      {recibidas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="rgba(255, 255, 255, 0.2)" />
          <Text style={styles.emptyTitle}>Sin postulaciones aún</Text>
          <Text style={styles.emptySub}>Las candidaturas recibidas para tus vacantes aparecerán en esta lista.</Text>
        </View>
      ) : (
        <FlatList
          data={recibidas}
          keyExtractor={(item) => item.id_i.toString()}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item }) => {
            let badgeColor = '#5A3FA0';
            if (item.estado === 'Seleccionada') badgeColor = '#2EC4B6';
            else if (item.estado === 'Rechazada') badgeColor = '#F2994A';
            else if (item.estado === 'Revisando') badgeColor = '#3182CE';

            return (
              <TouchableOpacity
                style={styles.portfolioCard}
                onPress={() => {
                  setSelectedApplicant(item);
                  setApplicantModalVisible(true);
                }}
              >
                <View style={[styles.portIconContainer, { backgroundColor: 'rgba(46, 196, 182, 0.15)' }]}>
                  <Ionicons name="person-outline" size={24} color="#2EC4B6" />
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <Text style={styles.portfolioCardTitle}>{item.artista_nombre || 'Artista Anónimo'}</Text>
                  <Text style={styles.portfolioCardType}>{item.conv_nombre}</Text>
                  <Text style={[styles.portfolioCardUrl, { color: '#CBD5E1' }]} numberOfLines={1}>
                    Área: {item.artista_area || 'General'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  <View style={{ backgroundColor: badgeColor + '22', borderWidth: 1, borderColor: badgeColor, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, color: badgeColor, fontWeight: '700' }}>{item.estado}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CBD5E1" style={{ marginTop: 6 }} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  // View I: Empresa Perfil
  const renderEmpresaPerfil = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="business" size={48} color="#5A3FA0" />
        </View>
        <Text style={styles.fullName}>{user?.fullName || 'Empresa Aliada'}</Text>
        <Text style={styles.artisticBadge}>{user?.sector || 'Sector Comercial'}</Text>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#5A3FA0" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{user?.email || 'empresa@correo.com'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Seguridad y Cuenta</Text>
        <TouchableOpacity onPress={() => setPasswordModalVisible(true)} style={styles.actionRow}>
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
    </ScrollView>
  );

  // View J: Admin Resumen
  const renderAdminResumen = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.welcomeBanner}>
        <View style={styles.bannerFlex}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeTitle}>Panel del Administrador</Text>
            <Text style={styles.welcomeSub}>Supervisa y gestiona la plataforma Jóvenes al Ruedo.</Text>
          </View>
          <Ionicons name="shield-checkmark" size={40} color="#2EC4B6" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={[styles.statCard, { width: '48%', marginBottom: 12 }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(46, 196, 182, 0.15)' }]}>
            <Ionicons name="people" size={24} color="#2EC4B6" />
          </View>
          <Text style={styles.statNumber}>{metrics.totalUsuarios}</Text>
          <Text style={styles.statLabel}>Total Usuarios</Text>
        </View>

        <View style={[styles.statCard, { width: '48%', marginBottom: 12 }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(90, 63, 160, 0.15)' }]}>
            <Ionicons name="person" size={24} color="#5A3FA0" />
          </View>
          <Text style={styles.statNumber}>{metrics.totalArtistas}</Text>
          <Text style={styles.statLabel}>Total Artistas</Text>
        </View>

        <View style={[styles.statCard, { width: '48%', marginBottom: 12 }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(242, 153, 74, 0.15)' }]}>
            <Ionicons name="business" size={24} color="#F2994A" />
          </View>
          <Text style={styles.statNumber}>{metrics.totalEmpresas}</Text>
          <Text style={styles.statLabel}>Total Empresas</Text>
        </View>

        <View style={[styles.statCard, { width: '48%', marginBottom: 12 }]}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(46, 196, 182, 0.15)' }]}>
            <Ionicons name="briefcase" size={24} color="#2EC4B6" />
          </View>
          <Text style={styles.statNumber}>{metrics.totalConvocatorias}</Text>
          <Text style={styles.statLabel}>Convocatorias</Text>
        </View>
      </View>

      <CustomButton
        title="Exportar Métricas del Sistema"
        onPress={() => customAlert('Éxito', 'El reporte excel con las métricas del sistema ha sido exportado correctamente.')}
        variant="accent"
      />
    </ScrollView>
  );

  // View K: Admin Usuarios
  const renderAdminUsuarios = () => {
    const filteredUsers = todosUsuarios.filter(
      u =>
        u.fullName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
    );

    return (
      <View style={{ flex: 1 }}>
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            placeholder="Buscar por nombre o correo..."
            placeholderTextColor="#A0AEC0"
            value={userSearchQuery}
            onChangeText={setUserSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.scrollContainer}
          renderItem={({ item }) => (
            <View style={styles.portfolioCard}>
              <View style={[styles.portIconContainer, { backgroundColor: item.role === 'empresa' ? 'rgba(242, 153, 74, 0.15)' : 'rgba(46, 196, 182, 0.15)' }]}>
                <Ionicons name={item.role === 'empresa' ? 'business' : 'person'} size={24} color={item.role === 'empresa' ? '#F2994A' : '#2EC4B6'} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.portfolioCardTitle}>{item.fullName}</Text>
                <Text style={styles.portfolioCardType}>{item.email}</Text>
                <Text style={[styles.portfolioCardUrl, { color: '#CBD5E1' }]}>
                  Rol: {item.role.toUpperCase()} {item.sector ? `• Sector: ${item.sector}` : ''} {item.artisticArea ? `• Área: ${item.artisticArea}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <TouchableOpacity
                  onPress={() => handleToggleUser(item.id, item.isActive)}
                  style={{
                    backgroundColor: item.isActive ? 'rgba(46, 196, 182, 0.15)' : 'rgba(242, 153, 74, 0.15)',
                    borderWidth: 1,
                    borderColor: item.isActive ? '#2EC4B6' : '#F2994A',
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 11, color: item.isActive ? '#2EC4B6' : '#F2994A', fontWeight: '700' }}>
                    {item.isActive ? 'Activo' : 'Inactivo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    );
  };

  // View L: Admin Convocatorias
  const renderAdminConvocatorias = () => (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <Text style={styles.subPageTitle}>Moderar Convocatorias</Text>
      </View>

      <FlatList
        data={convs}
        keyExtractor={(item) => item.id_conv.toString()}
        contentContainerStyle={styles.scrollContainer}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <View style={styles.jobHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.jobTitle}>{item.nombre}</Text>
                <Text style={styles.jobCompany}>{item.empresa_nombre} • {item.ubicacion}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteConvAdmin(item.id_conv)} style={styles.deleteBtn}>
                <Ionicons name="trash" size={20} color="#F2994A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.jobDesc}>{item.glue}</Text>
          </View>
        )}
      />
    </View>
  );

  // View M: Admin Perfil
  const renderAdminPerfil = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="shield-checkmark" size={48} color="#2EC4B6" />
        </View>
        <Text style={styles.fullName}>{user?.fullName || 'Administrador'}</Text>
        <Text style={styles.artisticBadge}>Administrador del Sistema</Text>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Ionicons name="mail" size={20} color="#5A3FA0" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Correo Electrónico</Text>
            <Text style={styles.infoValue}>{user?.email || 'admin@ejemplo.com'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCard}>
        <Text style={styles.cardTitle}>Seguridad y Cuenta</Text>
        <TouchableOpacity onPress={() => setPasswordModalVisible(true)} style={styles.actionRow}>
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
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header Bar */}
      <View style={styles.mainHeader}>
        <Text style={styles.mainHeaderTitle}>
          {activeTab === 'resumen' && (user?.role === 'admin' ? 'Métricas Globales' : 'Jóvenes al Ruedo')}
          {activeTab === 'convocatorias' && (user?.role === 'empresa' ? 'Mis Convocatorias' : 'Convocatorias')}
          {activeTab === 'candidatos' && 'Candidatos'}
          {activeTab === 'usuarios' && 'Gestión de Usuarios'}
          {activeTab === 'portafolio' && 'Portafolio'}
          {activeTab === 'chat' && 'Chats'}
          {activeTab === 'perfil' && 'Mi Perfil'}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#F2994A" />
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {(!user?.role || user?.role === 'artista') && (
          <>
            {activeTab === 'resumen' && renderResumen()}
            {activeTab === 'convocatorias' && renderConvocatorias()}
            {activeTab === 'portafolio' && renderPortafolio()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'perfil' && renderPerfil()}
          </>
        )}
        {user?.role === 'empresa' && (
          <>
            {activeTab === 'resumen' && renderEmpresaResumen()}
            {activeTab === 'convocatorias' && renderEmpresaConvocatorias()}
            {activeTab === 'candidatos' && renderEmpresaCandidatos()}
            {activeTab === 'chat' && renderChat()}
            {activeTab === 'perfil' && renderEmpresaPerfil()}
          </>
        )}
        {user?.role === 'admin' && (
          <>
            {activeTab === 'resumen' && renderAdminResumen()}
            {activeTab === 'usuarios' && renderAdminUsuarios()}
            {activeTab === 'convocatorias' && renderAdminConvocatorias()}
            {activeTab === 'perfil' && renderAdminPerfil()}
          </>
        )}
      </View>

      {/* Bottom Tabs Navigation Bar */}
      <View style={styles.bottomTabBar}>
        {getTabs().map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id as any)}
          >
            <Ionicons name={tab.icon as any} size={22} color={activeTab === tab.id ? '#2EC4B6' : '#A0AEC0'} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal 1: Convocatoria Details & Apply */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedConv && !applyModalVisible}
        onRequestClose={() => setSelectedConv(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Convocatoria</Text>
              <TouchableOpacity onPress={() => setSelectedConv(null)} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {selectedConv && (
              <ScrollView style={{ paddingBottom: 20 }}>
                <Text style={styles.detailJobTitle}>{selectedConv.nombre}</Text>
                <Text style={styles.detailCompany}>{selectedConv.empresa_nombre}</Text>

                <View style={styles.detailTagRow}>
                  <Text style={styles.jobTag}>{selectedConv.nivel_experiencia}</Text>
                  <Text style={styles.jobTag}>{selectedConv.tipo_jornada}</Text>
                </View>

                <View style={styles.detailInfoBlock}>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="location-outline" size={18} color="#2EC4B6" />
                    <Text style={styles.detailInfoText}>{selectedConv.ubicacion}</Text>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="cash-outline" size={18} color="#2EC4B6" />
                    <Text style={styles.detailInfoText}>{selectedConv.rango_salarial}</Text>
                  </View>
                </View>

                <Text style={styles.detailSectionTitle}>Descripción del Cargo</Text>
                <Text style={styles.detailText}>{selectedConv.glue}</Text>

                {appliedIds.includes(selectedConv.id_conv) ? (
                  <View style={styles.appliedCoverCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#2EC4B6" style={{ marginRight: 8 }} />
                    <Text style={styles.appliedCoverText}>Ya te postulaste formalmente a esta vacante.</Text>
                  </View>
                ) : (
                  <CustomButton
                    title="Postularme a esta Oferta"
                    onPress={() => setApplyModalVisible(true)}
                    variant="accent"
                    style={{ marginTop: 24 }}
                  />
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 2: Apply Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={applyModalVisible}
        onRequestClose={() => setApplyModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enviar Postulación</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.applyLabel}>Carta de Presentación / Mensaje</Text>
              <TextInput
                placeholder="Escribe por qué eres el candidato idóneo para esta oferta..."
                placeholderTextColor="#A0AEC0"
                multiline
                numberOfLines={6}
                value={applyCarta}
                onChangeText={setApplyCarta}
                style={styles.textArea}
              />

              <CustomInput
                label="Enlace a tu Hoja de Vida / CV (URL)"
                placeholder="https://drive.google.com/file/...pdf"
                iconName="document-text-outline"
                value={applyCvUrl}
                onChangeText={setApplyCvUrl}
                autoCapitalize="none"
              />

              <Text style={styles.applyLabel}>Adjuntar Obra de Portafolio (Opcional)</Text>
              {portfolios.length === 0 ? (
                <Text style={styles.noPortfoliosText}>No tienes obras registradas en tu portafolio aún.</Text>
              ) : (
                <View style={styles.portfolioSelectContainer}>
                  {portfolios.map((item) => {
                    const isSelected = selectedApplyPortId === item.id_port;
                    return (
                      <TouchableOpacity
                        key={item.id_port}
                        onPress={() => setSelectedApplyPortId(isSelected ? null : item.id_port)}
                        style={[
                          styles.portfolioSelectItem,
                          isSelected && styles.portfolioSelectItemActive,
                        ]}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? '#2EC4B6' : '#CBD5E1'}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.portfolioSelectText} numberOfLines={1}>
                          {item.titulo}
                        </Text>
                        <Text style={styles.portfolioSelectType}>({item.tipo})</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <CustomButton
                title="Confirmar y Postularme"
                onPress={handleApplySubmit}
                isLoading={loading}
                variant="primary"
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 3: Change Password */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.closeBtn}>
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
                isLoading={passwordLoading}
                variant="accent"
                style={{ marginTop: 16, marginBottom: 24 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 4: Add Portfolio Item */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addPortModalVisible}
        onRequestClose={() => setAddPortModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Obra de Portafolio</Text>
              <TouchableOpacity onPress={() => setAddPortModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              <CustomInput
                label="Título de la Obra"
                placeholder="Ej. Mi Primer Álbum / Mural de Calle"
                value={newPortTitle}
                onChangeText={setNewPortTitle}
                iconName="create-outline"
              />

              <Text style={styles.applyLabel}>Tipo de Trabajo</Text>
              <View style={styles.typeSelectorRow}>
                {['Imagen', 'Audio', 'Video', 'Documento'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setNewPortType(type)}
                    style={[
                      styles.typeSelectorItem,
                      newPortType === type && styles.typeSelectorItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorLabel,
                        newPortType === type && styles.typeSelectorLabelActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomInput
                label="Enlace del Archivo o Recurso (URL)"
                placeholder="https://drive.google.com/... o enlace de nube"
                value={newPortUrl}
                onChangeText={setNewPortUrl}
                iconName="link-outline"
                autoCapitalize="none"
              />

              <CustomButton
                title="Agregar Trabajo"
                onPress={handleAddPortfolioSubmit}
                isLoading={loadingPort}
                variant="accent"
                style={{ marginTop: 16 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 5: Chat Messaging View */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={chatModalVisible}
        onRequestClose={() => setChatModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatModalOverlay}
        >
          <View style={styles.chatModalContent}>
            {/* Header */}
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={() => setChatModalVisible(false)} style={styles.chatBackBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.chatHeaderName}>{activeChat?.nombre_empresa}</Text>
                <Text style={styles.chatHeaderSub}>Empresa Aliada</Text>
              </View>
              <Ionicons name="business" size={24} color="#2EC4B6" />
            </View>

            {/* Message List */}
            {loadingChats ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#2EC4B6" />
              </View>
            ) : (
              <FlatList
                data={chatMessages}
                keyExtractor={(item) => item.id_m}
                contentContainerStyle={styles.chatScroll}
                renderItem={({ item }) => {
                  const isMe = item.remitente === 'artista';
                  return (
                    <View style={[styles.msgContainer, isMe ? styles.msgRight : styles.msgLeft]}>
                      <View style={[styles.msgBubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
                        <Text style={styles.msgText}>{item.texto}</Text>
                        <Text style={styles.msgTime}>{item.fecha}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {/* Input Bar */}
            <View style={styles.chatInputBar}>
              <TextInput
                placeholder="Escribe tu mensaje..."
                placeholderTextColor="#A0AEC0"
                value={chatInput}
                onChangeText={setChatInput}
                style={styles.chatInput}
              />
              <TouchableOpacity onPress={handleSendMessage} disabled={sendingMsg} style={styles.chatSendBtn}>
                {sendingMsg ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal 6: Applicant Details (Company View) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={applicantModalVisible && !!selectedApplicant}
        onRequestClose={() => {
          setSelectedApplicant(null);
          setApplicantModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Postulación</Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedApplicant(null);
                  setApplicantModalVisible(false);
                }}
                style={styles.closeBtn}
              >
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {selectedApplicant && (
              <ScrollView keyboardShouldPersistTaps="handled">
                <Text style={styles.detailJobTitle}>{selectedApplicant.artista_nombre}</Text>
                <Text style={styles.detailCompany}>Postulado a: {selectedApplicant.conv_nombre}</Text>

                <View style={styles.detailInfoBlock}>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="mail-outline" size={18} color="#2EC4B6" />
                    <Text style={styles.detailInfoText}>{selectedApplicant.artista_email}</Text>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="calendar-outline" size={18} color="#2EC4B6" />
                    <Text style={styles.detailInfoText}>{selectedApplicant.artista_edad} años</Text>
                  </View>
                  <View style={styles.detailInfoItem}>
                    <Ionicons name="color-palette-outline" size={18} color="#2EC4B6" />
                    <Text style={styles.detailInfoText}>{selectedApplicant.artista_area}</Text>
                  </View>
                </View>

                <Text style={styles.detailSectionTitle}>Carta de Presentación</Text>
                <Text style={styles.detailText}>
                  {selectedApplicant.carta_presentacion || 'El candidato no adjuntó carta de presentación.'}
                </Text>

                {selectedApplicant.cv_url && (
                  <>
                    <Text style={styles.detailSectionTitle}>Hoja de Vida / CV Link</Text>
                    <Text style={[styles.detailText, { color: '#2EC4B6', textDecorationLine: 'underline' }]}>
                      {selectedApplicant.cv_url}
                    </Text>
                  </>
                )}

                <Text style={styles.detailSectionTitle}>Actualizar Estado del Candidato</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, marginBottom: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      handleUpdateStatus(selectedApplicant.id_i, 'Revisando');
                      setSelectedApplicant(prev => prev ? { ...prev, estado: 'Revisando' } : null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(49, 130, 206, 0.15)',
                      borderWidth: 1,
                      borderColor: '#3182CE',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ color: '#3182CE', fontSize: 12, fontWeight: '700' }}>Revisando</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      handleUpdateStatus(selectedApplicant.id_i, 'Seleccionada');
                      setSelectedApplicant(prev => prev ? { ...prev, estado: 'Seleccionada' } : null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(46, 196, 182, 0.15)',
                      borderWidth: 1,
                      borderColor: '#2EC4B6',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ color: '#2EC4B6', fontSize: 12, fontWeight: '700' }}>Seleccionar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      handleUpdateStatus(selectedApplicant.id_i, 'Rechazada');
                      setSelectedApplicant(prev => prev ? { ...prev, estado: 'Rechazada' } : null);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(242, 153, 74, 0.15)',
                      borderWidth: 1,
                      borderColor: '#F2994A',
                      paddingVertical: 10,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#F2994A', fontSize: 12, fontWeight: '700' }}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal 7: Create Convocatoria (Company View) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={createConvModalVisible}
        onRequestClose={() => setCreateConvModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Convocatoria</Text>
              <TouchableOpacity onPress={() => setCreateConvModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close-outline" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
              <CustomInput
                label="Nombre de la Vacante"
                placeholder="Ej. Cantante de Rock / Diseñador Gráfico"
                value={newConvNombre}
                onChangeText={setNewConvNombre}
                iconName="briefcase-outline"
              />

              <CustomInput
                label="Ubicación"
                placeholder="Ej. Bogotá, Remoto, Medellín"
                value={newConvUbicacion}
                onChangeText={setNewConvUbicacion}
                iconName="location-outline"
              />

              <CustomInput
                label="Rango Salarial"
                placeholder="Ej. $1.500.000 COP / A convenir"
                value={newConvSalario}
                onChangeText={setNewConvSalario}
                iconName="cash-outline"
              />

              <Text style={styles.applyLabel}>Nivel de Experiencia Requerido</Text>
              <View style={styles.typeSelectorRow}>
                {['Sin experiencia', '1-2 años', '3+ años'].map((exp) => (
                  <TouchableOpacity
                    key={exp}
                    onPress={() => setNewConvExp(exp)}
                    style={[
                      styles.typeSelectorItem,
                      newConvExp === exp && styles.typeSelectorItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorLabel,
                        newConvExp === exp && styles.typeSelectorLabelActive,
                      ]}
                    >
                      {exp}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.applyLabel}>Tipo de Jornada</Text>
              <View style={styles.typeSelectorRow}>
                {['Tiempo Completo', 'Medio Tiempo', 'Por Proyecto', 'Freelance'].map((jornada) => (
                  <TouchableOpacity
                    key={jornada}
                    onPress={() => setNewConvJornada(jornada)}
                    style={[
                      styles.typeSelectorItem,
                      newConvJornada === jornada && styles.typeSelectorItemActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeSelectorLabel,
                        newConvJornada === jornada && styles.typeSelectorLabelActive,
                      ]}
                    >
                      {jornada}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.applyLabel}>Descripción de la Oferta / Requisitos</Text>
              <TextInput
                placeholder="Describe las funciones, requisitos y detalles del proyecto..."
                placeholderTextColor="#A0AEC0"
                multiline
                numberOfLines={6}
                value={newConvGlue}
                onChangeText={setNewConvGlue}
                style={styles.textArea}
              />

              <CustomButton
                title="Publicar Convocatoria"
                onPress={handleCreateConvSubmit}
                isLoading={loading}
                variant="accent"
                style={{ marginTop: 16 }}
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
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  logoutBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },

  // Welcome banner style
  welcomeBanner: {
    backgroundColor: 'rgba(90, 63, 160, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  bannerFlex: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  welcomeSub: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
  },

  // Stats cards styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 2,
    fontWeight: '600',
  },

  // Section styling
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  seeAllText: {
    color: '#2EC4B6',
    fontWeight: '700',
    fontSize: 14,
  },

  // Convocatoria Job Card
  jobCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  jobCompany: {
    fontSize: 14,
    color: '#2EC4B6',
    fontWeight: '700',
    marginTop: 2,
  },
  jobDesc: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 18,
    marginVertical: 10,
  },
  tagRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  jobTag: {
    fontSize: 11,
    color: '#E2E8F0',
    backgroundColor: 'rgba(90, 63, 160, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    overflow: 'hidden',
    fontWeight: '600',
  },
  appliedBadge: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
    borderWidth: 1,
    borderColor: '#2EC4B6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appliedBadgeText: {
    fontSize: 11,
    color: '#2EC4B6',
    fontWeight: '700',
  },
  jobMetadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginLeft: 6,
    fontWeight: '500',
  },

  // Tips section card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 153, 74, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(242, 153, 74, 0.25)',
    borderRadius: 20,
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F2994A',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },

  // Search Bar
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    margin: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },

  // Portafolio styles
  portafolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  subPageTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addPortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2EC4B6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addPortBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 12,
  },
  portfolioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 16,
  },
  portIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  portfolioCardType: {
    fontSize: 12,
    color: '#2EC4B6',
    fontWeight: '600',
    marginTop: 2,
  },
  portfolioCardUrl: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(242, 153, 74, 0.1)',
  },

  // Empty View styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  // Chat conversation item styles
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginBottom: 12,
  },
  convoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(90, 63, 160, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#5A3FA0',
  },
  convoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  convoTime: {
    fontSize: 11,
    color: '#CBD5E1',
  },
  convoMsg: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
  },
  unreadBadge: {
    backgroundColor: '#F2994A',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Perfil style components
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

  // Bottom Tab Bar
  bottomTabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#1C1236',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  tabItemActive: {},
  tabLabel: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 4,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#2EC4B6',
    fontWeight: '700',
  },

  // Modal styling
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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

  // Convocatoria detail view styles
  detailJobTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailCompany: {
    fontSize: 16,
    color: '#2EC4B6',
    fontWeight: '700',
    marginTop: 4,
  },
  detailTagRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 16,
  },
  detailInfoBlock: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  detailInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailInfoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
    marginBottom: 8,
  },
  detailText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  appliedCoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(46, 196, 182, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(46, 196, 182, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  appliedCoverText: {
    color: '#2EC4B6',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },

  // Form styles
  applyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 8,
    marginTop: 12,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    textAlignVertical: 'top',
    height: 120,
    marginBottom: 16,
  },
  noPortfoliosText: {
    color: '#A0AEC0',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 16,
    marginLeft: 4,
  },
  portfolioSelectContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    marginBottom: 16,
  },
  portfolioSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  portfolioSelectItemActive: {
    backgroundColor: 'rgba(46, 196, 182, 0.15)',
  },
  portfolioSelectText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  portfolioSelectType: {
    color: '#2EC4B6',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },

  // Type Selector row
  typeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  typeSelectorItem: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    marginRight: 6,
  },
  typeSelectorItemActive: {
    backgroundColor: '#2EC4B6',
    borderColor: '#2EC4B6',
  },
  typeSelectorLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  typeSelectorLabelActive: {
    color: '#FFFFFF',
  },

  // Chat modal styles
  chatModalOverlay: {
    flex: 1,
    backgroundColor: '#2E1F5B',
  },
  chatModalContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1C1236',
  },
  chatBackBtn: {
    padding: 6,
  },
  chatHeaderName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  chatHeaderSub: {
    color: '#2EC4B6',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  chatScroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  msgContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  msgLeft: {
    justifyContent: 'flex-start',
  },
  msgRight: {
    justifyContent: 'flex-end',
  },
  msgBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleLeft: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: '#5A3FA0',
    borderTopRightRadius: 4,
  },
  msgText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  msgTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#1C1236',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    color: '#FFFFFF',
    fontSize: 15,
    marginRight: 10,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2EC4B6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
