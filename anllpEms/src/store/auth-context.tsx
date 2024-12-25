import { createContext, useState, ReactNode } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';


export interface AuthContextType {
  apiUrl: string;
  token: string | null;
  userName: string | null;
  userRole: string | null;
  userId: string | null;
  isAuthenticated: boolean;
  authenticate: (data: { token: string, userName: string, userRole: string, userId: string }) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  apiUrl: 'https://468fsrq8-8080.inc1.devtunnels.ms',
  token: '',
  userName: '',
  userRole: '',
  userId: '',
  isAuthenticated: false,
  authenticate: () => { },
  logout: () => { },
});

interface AuthContextProviderProps {
  children: ReactNode;
}

function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  function authenticate(data: { token: string, userName: string, userRole: string, userId: string }) {
    setAuthToken(data.token);
    setUserName(data.userName);
    setUserRole(data.userRole);
    setUserId(data.userId);
    AsyncStorage.setItem("userDetails", JSON.stringify(data))
      .then(() => {
        console.log('User details saved successfully');
      })
      .catch((error) => {
        console.error('Error saving user details:', error);
      });
  }

  function logout() {
    AsyncStorage.removeItem('userDetails');
    setAuthToken(null);
    setUserName(null);
    setUserRole(null);
  }

  const value = {
    apiUrl: 'https://468fsrq8-8080.inc1.devtunnels.ms',
    token: authToken,
    userName: userName,
    userRole: userRole,
    userId: userId,
    isAuthenticated: !!authToken,
    authenticate: authenticate,
    logout: logout,
  };

  return <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>;
}

export default AuthContextProvider;
