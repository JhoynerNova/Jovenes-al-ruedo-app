import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// In Android emulator, 10.0.2.2 points to host machine's localhost.
// In iOS or web, we use localhost.
const API_URL = 'http://10.0.2.2:8000/api/v1';

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

// Pre-populate with a demo user
const mockUsersDb: MockUser[] = [
  {
    id: 'demo-1234',
    email: 'artista@ejemplo.com',
    fullName: 'Jhoyner Nova',
    age: 20,
    artisticArea: 'Música',
    passwordHash: 'Contraseña123', // Simple text comparison for mock purposes
  },
];

// Helper to delay simulation (feels like a network request)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const registerUser = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/register', {
      email: data.email,
      full_name: data.fullName,
      age: data.age,
      artistic_area: data.artisticArea,
      password: data.password,
    });
    return response.data;
  } catch (error: any) {
    console.warn('Real API failed. Falling back to local Mock engine:', error.message);
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
      message: 'Joven artista registrado exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.fullName,
        age: newUser.age,
        artistic_area: newUser.artisticArea,
      },
    };
  }
};

export const loginUser = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/login', {
      username: data.email, // FastAPI typically uses OAuth2PasswordRequestForm
      password: data.password,
    });
    return response.data;
  } catch (error: any) {
    console.warn('Real API failed. Falling back to local Mock engine:', error.message);
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
  }
};

export const forgotPassword = async (email: string): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error: any) {
    console.warn('Real API failed. Falling back to local Mock engine:', error.message);
    await delay(1000);

    const user = mockUsersDb.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new Error('El correo electrónico no está registrado');
    }

    // Generate a temporary mock reset token (e.g. 123456)
    const mockToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetToken = mockToken;

    console.log(`[MOCK EMAIL SENT] To: ${email} | Code: ${mockToken}`);
    return {
      message: 'Correo de recuperación enviado con éxito. Revisa el registro de la consola.',
      mockToken, // Expose token to help user test easily in simulation!
    };
  }
};

export const resetPassword = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/reset-password', {
      token: data.token,
      new_password: data.password,
    });
    return response.data;
  } catch (error: any) {
    console.warn('Real API failed. Falling back to local Mock engine:', error.message);
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
  }
};

export const changePassword = async (data: any): Promise<any> => {
  try {
    const response = await apiClient.post('/auth/change-password', {
      current_password: data.currentPassword,
      new_password: data.newPassword,
    });
    return response.data;
  } catch (error: any) {
    console.warn('Real API failed. Falling back to local Mock engine:', error.message);
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
  }
};
