import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useContext, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bars2Icon, BellIcon, CalendarIcon, HomeIcon, PlusIcon, UserIcon } from 'react-native-heroicons/solid';
import MoreModal from '../../../components/BottomTab/MoreModal';
import COLORS from '../../../constants/colors';
import AttendanceScreen from '../../../screens/AttendanceScreen';
import HomeScreen from '../../../screens/HomeScreen';
import LeavesScreen from '../../../screens/LeaveScreen';
import getGreeting from '../../../util/greeting';
import { RootStackParamList } from '../AuthenticatedRoutes';
import { AuthContext } from '../../../store/auth-context';
export type BottomTabParamList = {
    Home: undefined;
    Attendance: undefined;
    Leaves: undefined;
    More: undefined;
};




const Tab = createBottomTabNavigator<BottomTabParamList>();
const BottomNavigator = () => {
    const { userName } = useContext(AuthContext)
    const greeting = getGreeting(userName);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    // Toggle modal visibility
    const [isModalVisible, setIsModalVisible] = useState(false);
    const toggleModal = () => {
        setIsModalVisible(!isModalVisible);
    };
    return (
        <>
            <Tab.Navigator
                screenOptions={() => ({
                    headerStyle: { backgroundColor: COLORS.ACCENT_ORANGE },
                    headerTintColor: "white",
                    tabBarActiveTintColor: COLORS.ACCENT_ORANGE,
                    tabBarStyle: {
                        height: 70,
                        borderTopRightRadius: 12,
                        borderTopLeftRadius: 12,
                    },
                    tabBarIconStyle: {
                        marginTop: 10,
                    },
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{
                        headerTitle: () => (
                            <View style={styles.headerTitleContainer}>
                                <Text style={styles.firstLine}>{greeting.firstLine}</Text>
                                <Text style={styles.secondLine}>{greeting.secondLine}</Text>
                            </View>
                        ),
                        tabBarIcon: ({ color, size }) => (
                            <HomeIcon size={size} color={color} />
                        ),
                        headerStyle: {
                            height: 160,
                            backgroundColor: COLORS.ACCENT_ORANGE,
                            borderBottomRightRadius: 12,
                            borderBottomLeftRadius: 12,
                        },
                        headerRight: () => (
                            <View style={styles.headerRightIconsContainer}>
                                <View style={styles.headerIconCont}>
                                    <BellIcon
                                        size={28}
                                        color="white"
                                        onPress={() => {
                                            navigation.navigate("Notifications");
                                        }}
                                    />
                                    <Text style={styles.ntfText}>1</Text>
                                </View>

                                <View style={styles.headerIconCont}>
                                    <UserIcon
                                        size={28}
                                        color="white"
                                        onPress={() => {
                                            navigation.navigate("Profile");
                                        }}
                                    />
                                </View>
                            </View>
                        ),
                    }}
                />
                <Tab.Screen
                    name="Attendance"
                    component={AttendanceScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <UserIcon size={size} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="Leaves"
                    component={LeavesScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <CalendarIcon size={size} color={color} />
                        ),
                        headerRight: () => (
                            <View style={{ marginRight: 12 }}>
                                <PlusIcon
                                    size={28}
                                    color="white"
                                    onPress={() => {
                                        navigation.navigate("Leave Application");
                                    }}
                                />
                            </View>
                        ),
                    }}
                />

                <Tab.Screen
                    name="More"
                    options={{
                        tabBarIcon: ({ color, size }) => (
                            <Bars2Icon size={size} color={color} />
                        ),
                        tabBarButton: (props) => (
                            <Pressable
                                {...props}
                                onPress={() => setIsModalVisible(true)}
                                android_ripple={{ color: "gray" }}
                                style={({ pressed }) => [
                                    {
                                        justifyContent: "center",
                                        alignItems: "center",
                                        backgroundColor: pressed ? COLORS.SEMI_GRAY : undefined,
                                    },
                                    props.style,
                                ]}
                            />
                        )
                    }}
                >
                    {() => null}
                </Tab.Screen>
            </Tab.Navigator>

            {/* Modal for "More" */}
            <MoreModal isModalVisible={isModalVisible} toggleModal={toggleModal} />
        </>
    )
}

export default BottomNavigator



const styles = StyleSheet.create({
    headerTitleContainer: {
        // alignItems: 'center',
        // justifyContent: 'center',
    },
    firstLine: {
        fontWeight: "bold",
        fontSize: 24,
        color: COLORS.WHITE,
    },
    secondLine: {
        fontSize: 13,
        color: COLORS.WHITE,
    },
    headerRightIconsContainer: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
    },
    headerIconCont: {
        position: "relative",
        padding: 4,
        backgroundColor: COLORS.SEMI_GRAY,
        borderRadius: 8,
    },
    ntfText: {
        position: "absolute",
        top: 2,
        right: 2,
        backgroundColor: "red",
        color: COLORS.WHITE,
        borderRadius: 8,
        width: 14,
        height: 14,
        textAlign: "center",
        alignItems: "center",
        fontSize: 10,
        fontWeight: "bold",
    },
});

