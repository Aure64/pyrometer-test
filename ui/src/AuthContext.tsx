import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuthenticateMutation } from './api';

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'pyrometer_admin_token';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );
  const [authenticate] = useAuthenticateMutation();

  const login = useCallback(
    async (inputToken: string): Promise<boolean> => {
      try {
        const { data } = await authenticate({
          variables: { token: inputToken },
        });
        if (data?.authenticate.success) {
          setToken(inputToken);
          localStorage.setItem(STORAGE_KEY, inputToken);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [authenticate],
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
