export interface User {
  id: string;
  email: string;
  fullName: string;
  age: number;
  artisticArea: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  logout: () => Promise<void>;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: { email?: string } | undefined;
  ResetPassword: { email: string; token?: string } | undefined;
  Dashboard: undefined;
};
