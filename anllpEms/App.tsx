import React, {useContext, useEffect, useState} from 'react';
import {StatusBar, Text, View} from 'react-native';
import AuthContextProvider, {AuthContext} from './src/store/auth-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationContainer} from '@react-navigation/native';
import COLORS from './src/constants/colors';
import AuthenticatedRoutes from './src/routes/Authenticated/AuthenticatedRoutes';
import NotAuthenticated from './src/routes/Not Authenticated/NotAuthenticated';
import Toast from 'react-native-toast-message';
import ToastConfig from './src/config/ToastConfig';
import {PaperProvider} from 'react-native-paper';
import customTheme from './src/theme/PaperTheme';
//

function Navigation() {
  const authCtx = useContext(AuthContext);
  return (
    <NavigationContainer>
      {authCtx.isAuthenticated ? <AuthenticatedRoutes /> : <NotAuthenticated />}
    </NavigationContainer>
  );
}

interface UserDetails {
  token: string;
  userName: string;
  userRole: string;
  userId: string;
}
function Root() {
  const [isTryingLogin, setIsTryingLogin] = useState<boolean>(true);
  const authCtx = useContext(AuthContext);
  useEffect(() => {
    async function fetchUserDetails() {
      const storedUserDetails = await AsyncStorage.getItem('userDetails');
      if (storedUserDetails != null) {
        const parsedDetails: UserDetails = JSON.parse(storedUserDetails);
        if (
          parsedDetails.token &&
          parsedDetails.userName &&
          parsedDetails.userRole &&
          parsedDetails.userId
        ) {
          authCtx.authenticate(parsedDetails);
        }
      }
      setIsTryingLogin(false);
    }
    fetchUserDetails();
  }, [authCtx]);

  useEffect(() => {
    if (!isTryingLogin) {
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading...</Text>
      </View>;
    }
  }, [isTryingLogin]);

  if (isTryingLogin) {
    return null;
  }

  return <Navigation />;
}
function App() {
  return (
    <AuthContextProvider>
      <PaperProvider theme={customTheme}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.ACCENT_ORANGE}
        />
        <Root />
        <Toast config={ToastConfig} />
      </PaperProvider>
    </AuthContextProvider>
  );
}

export default App;
