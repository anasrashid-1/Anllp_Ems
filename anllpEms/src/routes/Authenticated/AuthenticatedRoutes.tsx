/* eslint-disable react/no-unstable-nested-components */
import {useNavigation} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';
import {View} from 'react-native';
import {CalendarIcon, PlusIcon} from 'react-native-heroicons/solid';
import COLORS from '../../constants/colors';
import AddDailyExpense from '../../screens/AddDailyExpense';
import AddLeaveScreen from '../../screens/AddLeaveScreen';
import AddSalesLead from '../../screens/AddSalesLead';
import AllUsersLeaveRequests from '../../screens/AllUsersLeaveRequests';
import AttendanceAdmin from '../../screens/AttendanceAdmin';
import DailyExpenseAdmin from '../../screens/DailyExpenseAdmin';
import DailyExpenses from '../../screens/DailyExpenses';
import EmployeeLocation from '../../screens/EmployeeLocation';
import Growerdetails from '../../screens/Growerdetails';
import NotificationScreen from '../../screens/NotificationScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import SalesLeadScreen from '../../screens/SalesLeadScreen';
import BottomNavigator from './BottomNav/BottomNavigator';
import AddFollowupScreen from '../../screens/AddFollowupScreen';
import FollowupHistoryScreen from '../../screens/FollowupHistoryScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Profile: undefined;
  Notifications: undefined;
  'Leave Application': undefined;
  'Leave Requests': undefined;
  'Add Daily Expense': undefined;
  'Add Sales Lead': undefined;
  'Daily Expense Admin': undefined;
  'Attendance Admin': undefined;
  EmployeeLocation: undefined;
  'Grower Details': undefined;
  'Sales Lead': undefined;
  'Daily Expenses': undefined;
  'Add Followup': undefined;
};
const Stack = createStackNavigator<RootStackParamList>();

const AuthenticatedRoutes = () => {
  const navigation = useNavigation();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: COLORS.ACCENT_ORANGE},
        headerTintColor: 'white',
      }}>
      <Stack.Screen
        name="Tabs"
        component={BottomNavigator}
        options={{headerShown: false}}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
      <Stack.Screen name="Leave Application" component={AddLeaveScreen} />
      <Stack.Screen name="Leave Requests" component={AllUsersLeaveRequests} />
      <Stack.Screen name="Add Daily Expense" component={AddDailyExpense} />
      <Stack.Screen name="Add Sales Lead" component={AddSalesLead} />
      <Stack.Screen name="Daily Expense Admin" component={DailyExpenseAdmin} />
      <Stack.Screen name="Attendance Admin" component={AttendanceAdmin} />
      <Stack.Screen name="EmployeeLocation" component={EmployeeLocation} />
      <Stack.Screen name="Grower Details" component={Growerdetails} />
      <Stack.Screen
        name="Sales Lead"
        component={SalesLeadScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <CalendarIcon size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{marginRight: 12}}>
              <PlusIcon
                size={28}
                color="white"
                onPress={() => {
                  navigation.navigate('Add Sales Lead');
                }}
              />
            </View>
          ),
        }}
      />
      <Stack.Screen name="FollowupHistory" component={FollowupHistoryScreen}   />
      <Stack.Screen name="Add Followup" component={AddFollowupScreen} />
      <Stack.Screen
        name="Daily Expenses"
        component={DailyExpenses}
        options={{
          tabBarIcon: ({color, size}) => (
            <CalendarIcon size={size} color={color} />
          ),
          headerRight: () => (
            <View style={{marginRight: 12}}>
              <PlusIcon
                size={28}
                color="white"
                onPress={() => {
                  navigation.navigate('Add Daily Expense');
                }}
              />
            </View>
          ),
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthenticatedRoutes;
