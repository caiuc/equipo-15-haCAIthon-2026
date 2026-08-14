import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api/client';

// One key holding { token, role }, not two — a device only ever has one active session
// (patient or doctor), matching the single module-level `authToken` in api/client.js.
const STORAGE_KEY = 'sanito.session';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(async (raw) => {
      const session = raw && JSON.parse(raw);
      if (!session) return setLoading(false);
      setAuthToken(session.token);
      try {
        if (session.role === 'doctor') setDoctor((await api.doctorGetMe()).doctor);
        else setUser((await api.getMe()).user);
      } catch {
        // Expired/invalid session — drop it silently, the login screen will show.
        await AsyncStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  async function persistSession(role, { token, user, doctor }) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, role }));
    setAuthToken(token);
    if (role === 'doctor') setDoctor(doctor);
    else setUser(user);
  }

  const register = async (name, email, password) => persistSession('patient', await api.register(name, email, password));
  const login = async (email, password) => persistSession('patient', await api.login(email, password));
  const loginDoctor = async (email, password) => persistSession('doctor', await api.doctorLogin(email, password));

  const logout = async () => {
    await (doctor ? api.doctorLogout() : api.logout()).catch(() => {}); // best-effort — log out locally regardless
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setUser(null);
    setDoctor(null);
  };

  // Lets any screen refresh `user` after e.g. saving the profile form, without a full re-login.
  const refreshUser = async () => setUser((await api.getMe()).user);

  return (
    <AuthContext.Provider value={{ user, doctor, loading, register, login, loginDoctor, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
