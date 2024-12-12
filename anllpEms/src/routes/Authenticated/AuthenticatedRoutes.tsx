import { createStackNavigator } from '@react-navigation/stack';
import React from 'react'
import COLORS from '../../constants/colors';
import ProfileScreen from '../../screens/ProfileScreen';
import HomeScreen from '../../screens/HomeScreen';
import BottomNavigator from './BottomNav/BottomNavigator';
import AddLeaveScreen from '../../screens/AddLeaveScreen';
import AllUsersLeaveRequests from '../../screens/AllUsersLeaveRequests';

export type RootStackParamList = {
    Tabs: undefined;
    Profile: undefined;
    Notifications: undefined;
    "Leave Application": undefined;
    "Leave Requests": undefined;
  };
const Stack = createStackNavigator<RootStackParamList>();

const AuthenticatedRoutes = () => {
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: COLORS.ACCENT_ORANGE },
            headerTintColor: "white",
        }}>
            <Stack.Screen
                name="Tabs"
                component={BottomNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={HomeScreen} />
            <Stack.Screen name="Leave Application" component={AddLeaveScreen} />
            <Stack.Screen name="Leave Requests" component={AllUsersLeaveRequests} />
        </Stack.Navigator>
    )
}

export default AuthenticatedRoutes




