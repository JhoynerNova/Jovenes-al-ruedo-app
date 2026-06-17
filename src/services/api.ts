import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { supabase } from './supabaseClient';

// In Android emulator, 10.0.2.2 points to host machine's localhost.
// In iOS or web, we use localhost.
const API_URL = 'http://192.168.1.43:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to check if Supabase has been properly configured by the user
const isSupabaseConfigured = (): boolean => {
  // @ts-ignore
  const url = supabase.supabaseUrl;
  // @ts-ignore
  const key = supabase.supabaseKey;
  return !!(
    url &&
    !url.includes('tu-proyecto') &&
    key &&
    !key.includes('tu-anon-key')
  );
};

// ==========================================
// MOCK DATABASE & API FALLBACK
// ==========================================

interface MockUser {
  id: string;
  email: string;
  fullName: string;
  age: number;
  artisticArea: string;
  passwordHash: string;
  resetToken?: string;
}

const mockUsersDb: MockUser[] = [
  {
    id: 'demo-1234',
    email: 'artista@ejemplo.com',
    fullName: 'Jhoyner Nova',
    age: 20,
    artisticArea: 'Música',
    passwordHash: 'Contraseña123',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const registerUser = async (data: any): Promise<any> => {
  if (isSupabaseConfigured()) {
    try {
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - Number(data.age || 18);
      const birthDateStr = `${birthYear}-01-01`;

      // Registrar en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            age: Number(data.age),
            artistic_area: data.artisticArea,
            birth_date: birthDateStr,
            role: 'artista',
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      return {
        message: 'Joven artista registrado exitosamente en Supabase',
        user: authData.user,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al registrar usuario en Supabase');
    }
  }

  // FALLBACK: Motor Mock Local para pruebas offline
  console.warn('Supabase no configurado. Usando Mock local.');
  await delay(1000);

  const exists = mockUsersDb.some((u) => u.email.toLowerCase() === data.email.toLowerCase());
  if (exists) {
    throw new Error('El correo electrónico ya se encuentra registrado');
  }

  const newUser: MockUser = {
    id: Math.random().toString(36).substring(2, 11),
    email: data.email,
    fullName: data.fullName,
    age: Number(data.age),
    artisticArea: data.artisticArea,
    passwordHash: data.password,
  };

  mockUsersDb.push(newUser);
  return {
    message: 'Joven artista registrado exitosamente (Simulado)',
    user: {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.fullName,
      age: newUser.age,
      artistic_area: newUser.artisticArea,
    },
  };
};

export const loginUser = async (data: any): Promise<any> => {
  if (isSupabaseConfigured()) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        throw new Error(authError.message);
      }

      return {
        access_token: authData.session?.access_token || '',
        refresh_token: authData.session?.refresh_token || '',
        token_type: 'bearer',
        user: {
          id: authData.user?.id || '',
          email: authData.user?.email || '',
          full_name: authData.user?.user_metadata?.full_name || data.email,
          age: authData.user?.user_metadata?.age || 18,
          artistic_area: authData.user?.user_metadata?.artistic_area || '',
        },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al iniciar sesión en Supabase');
    }
  }

  // FALLBACK: Motor Mock Local
  console.warn('Supabase no configurado. Usando Mock local.');
  await delay(1000);

  const user = mockUsersDb.find(
    (u) =>
      u.email.toLowerCase() === data.email.toLowerCase() &&
      u.passwordHash === data.password
  );

  if (!user) {
    throw new Error('Credenciales incorrectas o usuario no registrado');
  }

  return {
    access_token: `mock_jwt_access_token_${user.id}`,
    refresh_token: `mock_jwt_refresh_token_${user.id}`,
    token_type: 'bearer',
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      age: user.age,
      artistic_area: user.artisticArea,
    },
  };
};

export const forgotPassword = async (email: string): Promise<any> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        throw new Error(error.message);
      }
      return {
        message: 'Correo de recuperación enviado con éxito por Supabase.',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al enviar correo de recuperación');
    }
  }

  // FALLBACK: Motor Mock Local
  console.warn('Supabase no configurado. Usando Mock local.');
  await delay(1000);

  const user = mockUsersDb.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error('El correo electrónico no está registrado');
  }

  const mockToken = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetToken = mockToken;

  console.log(`[MOCK EMAIL SENT] To: ${email} | Code: ${mockToken}`);
  return {
    message: 'Correo de recuperación enviado con éxito. Revisa el registro de la consola.',
    mockToken,
  };
};

export const resetPassword = async (data: any): Promise<any> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });
      if (error) {
        throw new Error(error.message);
      }
      return {
        message: 'Contraseña restablecida exitosamente en Supabase.',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al restablecer la contraseña');
    }
  }

  // FALLBACK: Motor Mock Local
  console.warn('Supabase no configurado. Usando Mock local.');
  await delay(1000);

  const user = mockUsersDb.find((u) => u.resetToken === data.token);
  if (!user) {
    throw new Error('El token/código es inválido o ha expirado');
  }

  user.passwordHash = data.password;
  delete user.resetToken;

  return {
    message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.',
  };
};

export const changePassword = async (data: any): Promise<any> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (error) {
        throw new Error(error.message);
      }
      return {
        message: 'Contraseña modificada exitosamente en Supabase',
      };
    } catch (error: any) {
      throw new Error(error.message || 'Error al modificar contraseña');
    }
  }

  // FALLBACK: Motor Mock Local
  console.warn('Supabase no configurado. Usando Mock local.');
  await delay(1000);

  const currentUser = useAuthStore.getState().user;
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const user = mockUsersDb.find((u) => u.id === currentUser.id);
  if (!user || user.passwordHash !== data.currentPassword) {
    throw new Error('La contraseña actual es incorrecta');
  }

  user.passwordHash = data.newPassword;
  return {
    message: 'Contraseña modificada exitosamente',
  };
};

// ==========================================
// MOCK DATA STORES FOR EXTENDED FEATURES
// ==========================================

export interface MockConvocatoria {
  id_conv: number;
  nombre: string;
  glue: string;
  nivel_experiencia: string;
  tipo_jornada: string;
  rango_salarial: string;
  ubicacion: string;
  empresa_nombre: string;
  created_at: string;
}

export interface MockPostulacion {
  id_i: number;
  id_conv: number;
  conv_nombre: string;
  empresa_nombre: string;
  estado: string; // 'Enviada' | 'Revisando' | 'Seleccionada' | 'Rechazada'
  carta_presentacion?: string;
  cv_url?: string;
  created_at: string;
}

export interface MockPortafolioItem {
  id_port: number;
  titulo: string;
  tipo: string; // 'Imagen' | 'Audio' | 'Video' | 'Documento'
  url: string;
  created_at: string;
}

export interface MockConversacion {
  id_c: string;
  nombre_empresa: string;
  ultimo_mensaje: string;
  fecha: string;
  no_leidos: number;
}

export interface MockMensaje {
  id_m: string;
  id_c: string;
  remitente: 'artista' | 'empresa';
  texto: string;
  fecha: string;
}

const mockConvocatorias: MockConvocatoria[] = [
  {
    id_conv: 101,
    nombre: 'Diseñador Gráfico Creativo',
    glue: 'Buscamos un diseñador con pasión por el arte digital y branding. Crearás piezas promocionales y colaboraciones visuales con marcas aliadas.',
    nivel_experiencia: 'Sin experiencia / Prácticas',
    tipo_jornada: 'Tiempo Completo',
    rango_salarial: '$1.500.000 - $1.800.000 COP',
    ubicacion: 'Bogotá, Colombia',
    empresa_nombre: 'Estudio Creativo 360',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id_conv: 102,
    nombre: 'Pintor de Murales Urbanos',
    glue: 'Convocatoria para colectivos o artistas individuales para intervenir espacios públicos de la ciudad. Materiales cubiertos al 100%.',
    nivel_experiencia: '1-2 años',
    tipo_jornada: 'Por Proyecto',
    rango_salarial: '$3.500.000 COP total',
    ubicacion: 'Medellín, Colombia',
    empresa_nombre: 'Secretaría de Cultura',
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
  {
    id_conv: 103,
    nombre: 'Guitarrista y Tecladista de Sesión',
    glue: 'Necesitamos músicos de sesión para grabar producción discográfica de género fusión indie-latino. Pago puntual por pista grabada.',
    nivel_experiencia: '2+ años',
    tipo_jornada: 'Por Horas',
    rango_salarial: '$200.000 COP / pista',
    ubicacion: 'Remoto',
    empresa_nombre: 'Llorona Records',
    created_at: new Date(Date.now() - 3600000 * 24 * 8).toISOString(),
  },
  {
    id_conv: 104,
    nombre: 'Actor de Doblaje / Locutor',
    glue: 'Grabación de voces en español neutro para serie animada educativa latinoamericana. Voces juveniles preferidas.',
    nivel_experiencia: 'Sin experiencia',
    tipo_jornada: 'Medio Tiempo',
    rango_salarial: '$1.200.000 COP',
    ubicacion: 'Bogotá, Colombia',
    empresa_nombre: 'Voces de América S.A.S.',
    created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
  },
  {
    id_conv: 105,
    nombre: 'Fotógrafo para Galería de Moda',
    glue: 'Cubrimiento fotográfico de pasarelas locales y sesiones con modelos. Debes tener cámara propia y óptica básica.',
    nivel_experiencia: '1-2 años',
    tipo_jornada: 'Freelance',
    rango_salarial: '$80.000 COP / hora',
    ubicacion: 'Cali, Colombia',
    empresa_nombre: 'Moda y Diseño S.A.',
    created_at: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  }
];

const mockPostulaciones: MockPostulacion[] = [
  {
    id_i: 501,
    id_conv: 101,
    conv_nombre: 'Diseñador Gráfico Creativo',
    empresa_nombre: 'Estudio Creativo 360',
    estado: 'Revisando',
    carta_presentacion: 'Hola, soy apasionado por la ilustración y manejo perfectamente Illustrator y Photoshop.',
    cv_url: 'https://ejemplo.com/mi_cv.pdf',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  }
];

const mockPortafolios: MockPortafolioItem[] = [
  {
    id_port: 1,
    titulo: 'Mural Esperanza Joven',
    tipo: 'Imagen',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id_port: 2,
    titulo: 'Demo Canción Acústica',
    tipo: 'Audio',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
  }
];

const mockConversaciones: MockConversacion[] = [
  {
    id_c: 'chat_1',
    nombre_empresa: 'Estudio Creativo 360',
    ultimo_mensaje: 'Hola Jhoyner, vimos tu postulación. ¿Tienes portafolio impreso?',
    fecha: '11:20 AM',
    no_leidos: 2,
  },
  {
    id_c: 'chat_2',
    nombre_empresa: 'Voces de América S.A.S.',
    ultimo_mensaje: '¡Excelente voz! Te contactaremos el lunes.',
    fecha: 'Ayer',
    no_leidos: 0,
  }
];

const mockMensajes: Record<string, MockMensaje[]> = {
  'chat_1': [
    {
      id_m: 'm1',
      id_c: 'chat_1',
      remitente: 'artista',
      texto: 'Hola, buenas tardes. Apliqué a la vacante de diseñador.',
      fecha: 'Ayer, 3:00 PM',
    },
    {
      id_m: 'm2',
      id_c: 'chat_1',
      remitente: 'empresa',
      texto: 'Hola Jhoyner, vimos tu postulación. ¿Tienes portafolio impreso?',
      fecha: '11:20 AM',
    }
  ],
  'chat_2': [
    {
      id_m: 'm3',
      id_c: 'chat_2',
      remitente: 'artista',
      texto: 'Adjunto la audición de voz del personaje principal.',
      fecha: 'Ayer, 9:00 AM',
    },
    {
      id_m: 'm4',
      id_c: 'chat_2',
      remitente: 'empresa',
      texto: '¡Excelente voz! Te contactaremos el lunes.',
      fecha: 'Ayer, 10:15 AM',
    }
  ]
};

// ==========================================
// BUSINESS METHODS FOR EXTENDED FEATURES
// ==========================================

export const getConvocatorias = async (search?: string): Promise<MockConvocatoria[]> => {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('conv').select('*');
      if (search) {
        query = query.ilike('nombre', `%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      
      return (data || []).map((c: any) => ({
        id_conv: c.id_conv,
        nombre: c.nombre,
        glue: c.glue,
        nivel_experiencia: c.nivel_experiencia || 'No especificado',
        tipo_jornada: c.tipo_jornada || 'No especificado',
        rango_salarial: c.rango_salarial || 'A convenir',
        ubicacion: c.ubicacion || 'Nacional',
        empresa_nombre: c.empresa_nombre || 'Empresa Aliada',
        created_at: c.created_at,
      }));
    } catch (error) {
      console.warn('Error fetching from Supabase, falling back to mock:', error);
    }
  }

  await delay(600);
  if (search) {
    return mockConvocatorias.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()) || c.empresa_nombre.toLowerCase().includes(search.toLowerCase()));
  }
  return [...mockConvocatorias];
};

export const applyToConvocatoria = async (convId: number, data: { carta_presentacion?: string, cv_url?: string }): Promise<any> => {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) throw new Error('Usuario no autenticado');

  if (isSupabaseConfigured()) {
    try {
      const { data: inserted, error } = await supabase.from('inscripcion').insert({
        id_conv: convId,
        id_usr: currentUser.id,
        estado: 'Enviada',
        carta_presentacion: data.carta_presentacion,
        cv_url: data.cv_url,
      }).select().single();

      if (error) throw new Error(error.message);
      return inserted;
    } catch (error) {
      console.warn('Error applying via Supabase, falling back to mock:', error);
    }
  }

  await delay(800);
  const conv = mockConvocatorias.find(c => c.id_conv === convId);
  if (!conv) throw new Error('Convocatoria no encontrada');

  const alreadyApplied = mockPostulaciones.some(p => p.id_conv === convId);
  if (alreadyApplied) throw new Error('Ya te has postulado a esta convocatoria');

  const newPost: MockPostulacion = {
    id_i: Math.floor(1000 + Math.random() * 9000),
    id_conv: convId,
    conv_nombre: conv.nombre,
    empresa_nombre: conv.empresa_nombre,
    estado: 'Enviada',
    carta_presentacion: data.carta_presentacion,
    cv_url: data.cv_url || 'https://jovenes-al-ruedo.com/default-cv.pdf',
    created_at: new Date().toISOString(),
  };

  mockPostulaciones.push(newPost);
  return { message: 'Postulación exitosa', application: newPost };
};

export const getMisPostulaciones = async (): Promise<MockPostulacion[]> => {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) throw new Error('Usuario no autenticado');

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('inscripcion')
        .select('*, conv:id_conv(*)')
        .eq('id_usr', currentUser.id);

      if (error) throw new Error(error.message);
      return (data || []).map((p: any) => ({
        id_i: p.id_i,
        id_conv: p.id_conv,
        conv_nombre: p.conv?.nombre || 'Convocatoria',
        empresa_nombre: p.conv?.empresa_nombre || 'Empresa Aliada',
        estado: p.estado || 'Enviada',
        carta_presentacion: p.carta_presentacion,
        cv_url: p.cv_url,
        created_at: p.created_at,
      }));
    } catch (error) {
      console.warn('Error fetching applications from Supabase, falling back to mock:', error);
    }
  }

  await delay(500);
  return [...mockPostulaciones];
};

export const getPortafolios = async (): Promise<MockPortafolioItem[]> => {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) throw new Error('Usuario no autenticado');

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('portafolio')
        .select('*')
        .eq('id_usr', currentUser.id);

      if (error) throw new Error(error.message);
      return (data || []).map((p: any) => ({
        id_port: p.id_port,
        titulo: p.titulo,
        tipo: p.tipo || 'Imagen',
        url: p.archivo || p.url || '',
        created_at: p.created_at,
      }));
    } catch (error) {
      console.warn('Error fetching portfolio from Supabase, falling back to mock:', error);
    }
  }

  await delay(500);
  return [...mockPortafolios];
};

export const addPortafolioItem = async (data: { titulo: string, tipo: string, url: string }): Promise<MockPortafolioItem> => {
  const currentUser = useAuthStore.getState().user;
  if (!currentUser) throw new Error('Usuario no autenticado');

  if (isSupabaseConfigured()) {
    try {
      const { data: inserted, error } = await supabase.from('portafolio').insert({
        id_usr: currentUser.id,
        titulo: data.titulo,
        tipo: data.tipo,
        archivo: data.url,
        estado: 'P',
      }).select().single();

      if (error) throw new Error(error.message);
      return {
        id_port: inserted.id_port,
        titulo: inserted.titulo,
        tipo: inserted.tipo,
        url: inserted.archivo,
        created_at: inserted.created_at,
      };
    } catch (error) {
      console.warn('Error adding portfolio item via Supabase, falling back to mock:', error);
    }
  }

  await delay(700);
  const newItem: MockPortafolioItem = {
    id_port: Math.floor(100 + Math.random() * 900),
    titulo: data.titulo,
    tipo: data.tipo,
    url: data.url,
    created_at: new Date().toISOString(),
  };

  mockPortafolios.push(newItem);
  return newItem;
};

export const deletePortafolioItem = async (id: number): Promise<any> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('portafolio')
        .delete()
        .eq('id_port', id);

      if (error) throw new Error(error.message);
      return { success: true };
    } catch (error) {
      console.warn('Error deleting portfolio item via Supabase, falling back to mock:', error);
    }
  }

  await delay(500);
  const idx = mockPortafolios.findIndex(p => p.id_port === id);
  if (idx !== -1) {
    mockPortafolios.splice(idx, 1);
  }
  return { success: true };
};

export const getConversaciones = async (): Promise<MockConversacion[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('conversacion')
        .select('*');

      if (error) throw new Error(error.message);
      return (data || []).map((c: any) => ({
        id_c: c.id_c,
        nombre_empresa: c.nombre_empresa || 'Empresa Aliada',
        ultimo_mensaje: c.ultimo_mensaje || 'Conversación iniciada',
        fecha: c.fecha || 'Hoy',
        no_leidos: c.no_leidos || 0,
      }));
    } catch (error) {
      console.warn('Error fetching chats from Supabase, falling back to mock:', error);
    }
  }

  await delay(500);
  return [...mockConversaciones];
};

export const getMensajes = async (chatId: string): Promise<MockMensaje[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('mensaje')
        .select('*')
        .eq('id_c', chatId)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data || []).map((m: any) => ({
        id_m: m.id_m,
        id_c: m.id_c,
        remitente: m.remitente,
        texto: m.texto,
        fecha: m.created_at,
      }));
    } catch (error) {
      console.warn('Error fetching messages from Supabase, falling back to mock:', error);
    }
  }

  await delay(400);
  return mockMensajes[chatId] || [];
};

export const enviarMensaje = async (chatId: string, text: string): Promise<MockMensaje> => {
  if (isSupabaseConfigured()) {
    try {
      const { data: inserted, error } = await supabase.from('mensaje').insert({
        id_c: chatId,
        remitente: 'artista',
        texto: text,
      }).select().single();

      if (error) throw new Error(error.message);
      return {
        id_m: inserted.id_m,
        id_c: inserted.id_c,
        remitente: 'artista',
        texto: inserted.texto,
        fecha: inserted.created_at,
      };
    } catch (error) {
      console.warn('Error sending message via Supabase, falling back to mock:', error);
    }
  }

  await delay(300);
  const newMsg: MockMensaje = {
    id_m: Math.random().toString(36).substring(2, 9),
    id_c: chatId,
    remitente: 'artista',
    texto: text,
    fecha: 'Justo ahora',
  };

  if (!mockMensajes[chatId]) {
    mockMensajes[chatId] = [];
  }
  mockMensajes[chatId].push(newMsg);

  // Update latest message in convo
  const convo = mockConversaciones.find(c => c.id_c === chatId);
  if (convo) {
    convo.ultimo_mensaje = text;
    convo.fecha = 'Justo ahora';
  }

  return newMsg;
};
