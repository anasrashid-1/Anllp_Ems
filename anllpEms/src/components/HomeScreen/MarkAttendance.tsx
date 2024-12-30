import React, { FC } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import COLORS from '../../constants/colors';
import { ShoppingBagIcon, HomeIcon } from 'react-native-heroicons/solid';
import { AttendanceStatus } from '../../screens/HomeScreen';
import { formatTime } from '../../util/formatTime';

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
                <ActivityIndicator size="large" color={COLORS.DARK_GRAY} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.dateText}>{today}</Text>

            <View style={styles.card}>
                {attendanceStatus?.onLeave ? (
                    <Text style={styles.leaveText}>Enjoy your day off!</Text>
                ) : (
                    <>
                        {/* Show status and icon only if not checked out */}
                        {!attendanceStatus?.checkOutTime && (
                            <View style={styles.statusContainer}>
                                <Text style={styles.statusText}>
                                    {attendanceStatus?.status === 'Active' ? "Let's get to home" : "Let's get to work"}
                                </Text>
                                {attendanceStatus?.status === 'Active' ? (
                                    <HomeIcon size={32} color={COLORS.ACCENT_ORANGE} />
                                ) : (
                                    <ShoppingBagIcon size={32} color={COLORS.ACCENT_ORANGE} />
                                )}
                            </View>
                        )}

                        {attendanceStatus?.checkOutTime ? (
                            <Text style={styles.doneText}>You're done for today!</Text>
                        ) : (
                            <TouchableOpacity
                                style={[styles.button, attendanceStatus?.status === 'Active' ? styles.activeButton : styles.inactiveButton]}
                                onPress={handlePress}
                            >
                                <Text style={styles.buttonText}>
                                    {attendanceStatus?.status === 'Active' ? 'Check Out' : 'Check In'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {attendanceStatus?.checkOutTime ? (
                            <>
                                <Text style={styles.sessionText}>
                                    You Started at: {formatTime(attendanceStatus?.checkInTime)}, Ended at: {formatTime(attendanceStatus?.checkOutTime)}
                                </Text>
                                <Text style={styles.sessionText}>
                                    Session Duration: {formatSessionDuration(attendanceStatus?.sessionDuration || 0)}
                                </Text>
                            </>
                        ) : (
                            <Text style={styles.infoText}>
                                {!attendanceStatus?.checkInTime ? 'Please check in to continue' : `You have checked in at ${formatTime(attendanceStatus?.checkInTime)}`}
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
        backgroundColor: '#F9FAFB',
        padding: 16,
        justifyContent: 'center',
    },
    card: {
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    dateText: {
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.DARK_GRAY,
        textAlign: 'center',
        marginBottom: 12,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    button: {
        width: '100%',
        height: 48,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
    },
    activeButton: {
        backgroundColor: COLORS.ACCENT_ORANGE,
    },
    inactiveButton: {
        backgroundColor: COLORS.ACCENT_ORANGE,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
        color: '#FFFFFF',
    },
    leaveText: {
        fontWeight: '700',
        fontSize: 18,
        color: COLORS.PRIMARY_GREEN,
        textAlign: 'center',
        marginBottom: 16,
    },
    statusText: {
        fontWeight: '700',
        fontSize: 18,
        color: COLORS.MEDIUM_GRAY,
        marginRight: 8,
    },
    doneText: {
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.ACCENT_ORANGE,
        textAlign: 'center',
        marginBottom: 16,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.MEDIUM_GRAY,
        textAlign: 'center',
        marginTop: 8,
    },
    sessionText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.MEDIUM_GRAY,
        textAlign: 'center',
        marginTop: 16,
    },
});
