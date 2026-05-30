import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User } from '../types';

const ACCESS_TOKEN_KEY = 'jar_access_token';
const REFRESH_TOKEN_KEY = 'jar_refresh_token';
const USER_KEY = 'jar_user_info';

// Helper to check if SecureStore is available (web safety)
const isSecureStoreAvailable = async (): Promise<boolean> => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

// Memory fallback for non-native environments
const memoryStore: Record<string, string> = {};

const setSecureItem = async (key: string, value: string): Promise<void> => {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
  } else {
    memoryStore[key] = value;
  }
};

const getSecureItem = async (key: string): Promise<string | null> => {
  if (await isSecureStoreAvailable()) {
    return await SecureStore.getItemAsync(key);
  }
  return memoryStore[key] || null;
};

const deleteSecureItem = async (key: string): Promise<void> => {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
  } else {
    delete memoryStore[key];
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  error: null,

  setUser: (user: User | null) => set({ user }),

  setTokens: (accessToken: string | null, refreshToken: string | null) => {
    set({ accessToken, refreshToken });
    if (accessToken && refreshToken) {
      setSecureItem(ACCESS_TOKEN_KEY, accessToken).catch(console.error);
      setSecureItem(REFRESH_TOKEN_KEY, refreshToken).catch(console.error);
    } else {
      deleteSecureItem(ACCESS_TOKEN_KEY).catch(console.error);
      deleteSecureItem(REFRESH_TOKEN_KEY).catch(console.error);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await deleteSecureItem(ACCESS_TOKEN_KEY);
      await deleteSecureItem(REFRESH_TOKEN_KEY);
      await deleteSecureItem(USER_KEY);
      set({ user: null, accessToken: null, refreshToken: null, error: null });
    } catch (err: any) {
      set({ error: err.message || 'Error occurred during logout' });
    } finally {
      set({ isLoading: false });
    }
  },

  setError: (error: string | null) => set({ error }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
}));

// Initialize store values from persistent storage
export const initializeAuthStore = async (): Promise<void> => {
  const store = useAuthStore.getState();
  try {
    const accessToken = await getSecureItem(ACCESS_TOKEN_KEY);
    const refreshToken = await getSecureItem(REFRESH_TOKEN_KEY);
    const userJson = await getSecureItem(USER_KEY);

    if (accessToken && refreshToken && userJson) {
      const user = JSON.parse(userJson) as User;
      useAuthStore.setState({ user, accessToken, refreshToken, isLoading: false });
    } else {
      useAuthStore.setState({ isLoading: false });
    }
  } catch (e) {
    console.error('Failed to load session from SecureStore', e);
    useAuthStore.setState({ isLoading: false });
  }
};

export const persistUserSession = async (user: User): Promise<void> => {
  try {
    await setSecureItem(USER_KEY, JSON.stringify(user));
    useAuthStore.getState().setUser(user);
  } catch (e) {
    console.error('Failed to persist user session', e);
  }
};
