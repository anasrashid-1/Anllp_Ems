import { createStackNavigator } from '@react-navigation/stack';
import React from 'react'
import LoginScreen from '../../screens/LoginScreen';
type StackParamList = {
    LoginScreen: undefined;
  };
const Stack = createStackNavigator<StackParamList>();

const NotAuthenticated = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    )
}

export default NotAuthenticated
