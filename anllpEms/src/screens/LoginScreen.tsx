/* eslint-disable @typescript-eslint/no-shadow */
import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Text,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import COLORS from '../constants/colors';
import { AuthContext, AuthContextType } from '../store/auth-context';
import Input from '../components/LoginScreen/Input';
import { showToast } from '../util/toastUtil';



const LoginScreen: React.FC = () => {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isPasswordVisible, setPasswordVisible] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const authCtx = useContext<AuthContextType>(AuthContext);

  const handleLogin = async (employeeId: string, password: string) => {
    setIsAuthenticating(true);
    if (!employeeId || !password) {
      setIsAuthenticating(false);
      return showToast(
        'error',
        'Missing Fields',
        'Please enter both Employee ID and Password'
      );
    }

    if (isNaN(Number(employeeId)) || Number(employeeId) <= 0 || password.length <= 3) {
      setIsAuthenticating(false);
      return showToast(
        'error',
        'Invalid Input',
        'Invalid Employee ID or Password format'
      );
    }


    try {
      const res = await fetch(`${authCtx.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ empId: employeeId, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setIsAuthenticating(false);

        return showToast(
          'error',
          'Login Error',
          errorData.message || 'Login failed. Please try again.'
        );
      }

      const data = await res.json();

      if (data.token && data.userName && data.userRole && data.userId) {
        authCtx.authenticate(data);
        console.log(' authCtx.authenticate(data) called');
        showToast('success', 'Welcome!', `Success, Welcome ${employeeId} 👋`);
      } else {
        showToast(
          'error',
          'Invalid Credentials',
          data.message || 'Wrong Employee ID or Password.'
        );
      }
    } catch (error) {
      console.error('Error during login:', error);
      showToast(
        'error',
        'Error',
        'Something went wrong. Please try again later.'
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../public/apples2.jpg')}
      style={styles.backgroundImage}
    >
      <View style={styles.formContainer}>
        <View style={styles.form}>
          <View style={styles.formLogoContainer}>
            <Image style={styles.logo} source={require('../../public/Logo.jpg')} />
          </View>
          <Input
            label="Employee Id"
            keyboardType="numeric"
            onUpdateValue={setEmployeeId}
            value={employeeId}
          />



          <Input
            label="Password"
            keyboardType="default"
            onUpdateValue={setPassword}
            value={password}
            secureTextEntry={!isPasswordVisible}
            showPasswordToggle
            onTogglePassword={() => setPasswordVisible((prev) => !prev)}
            isPasswordVisible={isPasswordVisible}
          />
          <TouchableOpacity
            disabled={isAuthenticating}
            onPress={() => { }}
          >
            <Text style={[styles.forgotPasswordText,
            isAuthenticating && styles.disabledText,
            ]}>
              Forgot your password?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={isAuthenticating}
            style={[
              styles.button,
              isAuthenticating && styles.authenticatingButton,
            ]}
            onPress={() => handleLogin(employeeId, password)}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="green" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    padding: 20,
    paddingBottom: 40,
    width: '90%',
    maxWidth: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  formLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  forgotPasswordText: {
    fontSize: 12,
    textAlign: 'right',
    paddingRight: 2,
    color: 'gray',
  },
  disabledText: {
    color: COLORS.LIGHT_GRAY,
  },
  button: {
    marginTop: 16,
    backgroundColor: COLORS.ACCENT_ORANGE,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  authenticatingButton: {
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
