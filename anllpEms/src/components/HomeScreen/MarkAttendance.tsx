import React, { FC } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import COLORS from '../../constants/colors';
import { ShoppingBagIcon, HomeIcon } from 'react-native-heroicons/solid';
import { AttendanceStatus } from '../../screens/HomeScreen';


type MarkAttendanceProps = {
    handleCheckIn: () => Promise<void>;
    stopTracking: () => Promise<void>;
    attendanceStatus: AttendanceStatus | null;
    loading: boolean;
};
const MarkAttendance: FC<MarkAttendanceProps> = ({ handleCheckIn, stopTracking, attendanceStatus, loading }) => {
    const date = new Date();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const dayOfMonth = date.getDate();

    const today = `${day}, ${dayOfMonth} ${month}`;

    const handlePress = async () => {
        if (attendanceStatus?.status === 'Active') {
            await stopTracking();
        } else {
            await handleCheckIn();
        }
    };

    const formatSessionDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr ${remainingMinutes} min`;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.dateText}>{today}</Text>

            <View style={styles.btnContainer}>
                {attendanceStatus?.onLeave ? (
                    <Text style={styles.leaveText}>Enjoy your day off!</Text>
                ) : (
                    <>
                        {!attendanceStatus?.checkOutTime && (
                            <View style={styles.textAndIconContainer}>
                                <Text style={styles.statusText}>
                                    {attendanceStatus?.status === 'Active' ? "Let's get to home" : "Let's get to work"}
                                </Text>
                                {attendanceStatus?.status === 'Active' ? (
                                    <HomeIcon size={30} color={COLORS.DARK_GRAY} />
                                ) : (
                                    <ShoppingBagIcon size={30} color={COLORS.DARK_GRAY} />
                                )}
                            </View>
                        )}

                        {attendanceStatus?.checkOutTime ? (
                            <Text style={styles.doneText}>Already done for today</Text>
                        ) : (
                            <TouchableOpacity
                                disabled={!!attendanceStatus?.checkOutTime}
                                style={[styles.button, attendanceStatus?.checkOutTime && styles.disabledButton]}
                                onPress={handlePress}
                            >
                                <Text style={styles.buttonText}>
                                    {attendanceStatus?.status === 'Active' ? 'Check Out' : 'Check In'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        <Text style={styles.infoText}>Your hours will be calculated here.</Text>

                        {attendanceStatus?.checkOutTime && (
                            <Text style={styles.sessionText}>
                                Session Duration: {formatSessionDuration(attendanceStatus?.sessionDuration || 0)}
                            </Text>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

export default MarkAttendance;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 8,
        backgroundColor: 'white',
        width: '70%',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        elevation: 5,
        alignSelf: 'center',
    },
    btnContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderTopWidth: 0.2,
        borderBottomWidth: 0.2,
        borderTopColor: 'lightgrey',
        borderBottomColor: 'lightgrey',
    },
    textAndIconContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    button: {
        width: '95%',
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.ACCENT_ORANGE,
        borderRadius: 4,
        marginVertical: 12,
    },
    disabledButton: {
        backgroundColor: 'gray',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateText: {
        fontWeight: 'bold',
        color: 'gray',
        fontSize: 14,
        marginBottom: 4,
    },
    leaveText: {
        fontWeight: 'bold',
        color: COLORS.DARK_GRAY,
        fontSize: 16,
        marginVertical: 12,
    },
    statusText: {
        fontWeight: 'bold',
        color: 'gray',
        fontSize: 16,
    },
    doneText: {
        fontWeight: 'bold',
        color: COLORS.ACCENT_ORANGE,
        fontSize: 16,
        marginVertical: 12,
    },
    infoText: {
        fontWeight: 'bold',
        color: 'gray',
        fontSize: 14,
    },
    sessionText: {
        fontWeight: 'bold',
        color: COLORS.DARK_GRAY,
        fontSize: 14,
        marginTop: 8,
    },
});