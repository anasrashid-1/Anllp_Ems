import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { View } from 'react-native';
import { CalendarIcon, PlusIcon } from 'react-native-heroicons/solid';
import COLORS from '../../constants/colors';
import AddLeaveScreen from '../../screens/AddLeaveScreen';
import AllUsersLeaveRequests from '../../screens/AllUsersLeaveRequests';
import DailyExpenses from '../../screens/DailyExpenses';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import BottomNavigator from './BottomNav/BottomNavigator';
import AddDailyExpense from '../../screens/AddDailyExpense';
import { useNavigation } from '@react-navigation/native';
import DailyExpenseAdmin from '../../screens/DailyExpenseAdmin';
import AttendanceAdmin from '../../screens/AttendanceAdmin';
import EmployeeLocation from '../../screens/EmployeeLocation';
import NotificationScreen from '../../screens/NotificationScreen';


export type RootStackParamList = {
    Tabs: undefined;
    Profile: undefined;
    Notifications: undefined;
    'Leave Application': undefined;
    'Leave Requests': undefined;
};
const Stack = createStackNavigator<RootStackParamList>();

const AuthenticatedRoutes = () => {
    const navigation = useNavigation()
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: COLORS.ACCENT_ORANGE },
            headerTintColor: 'white',
        }}>
            <Stack.Screen
                name="Tabs"
                component={BottomNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Notifications" component={NotificationScreen} />
            <Stack.Screen name="Leave Application" component={AddLeaveScreen} />
            <Stack.Screen name="Leave Requests" component={AllUsersLeaveRequests} />
            <Stack.Screen name="Add Daily Expense" component={AddDailyExpense} />
            <Stack.Screen name="Daily Expense Admin" component={DailyExpenseAdmin} />
            <Stack.Screen name="Attendance Admin" component={AttendanceAdmin} />
            <Stack.Screen name="EmployeeLocation" component={EmployeeLocation} />
            <Stack.Screen name="Daily Expenses" component={DailyExpenses} options={{
                tabBarIcon: ({ color, size }) => (
                    <CalendarIcon size={size} color={color} />
                ),
                headerRight: () => (
                    <View style={{ marginRight: 12 }}>
                        <PlusIcon
                            size={28}
                            color="white"
                            onPress={() => {
                                navigation.navigate('Add Daily Expense');
                            }}
                        />
                    </View>
                ),
            }} />
        </Stack.Navigator>
    );
};

export default AuthenticatedRoutes;




