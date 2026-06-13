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
  return (
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
