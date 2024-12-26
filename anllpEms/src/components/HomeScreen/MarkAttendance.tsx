import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import COLORS from '../../constants/colors';
import { ShoppingBagIcon, HomeIcon } from 'react-native-heroicons/solid';


const MarkAttendance = ({ startBackgroundLocation, stopTracking, attendancestatus }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);


    const date = new Date();
    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const dayOfMonth = date.getDate();

    const today = `${day}, ${dayOfMonth} ${month}`;


    const handlePress = async () => {

        if (attendancestatus?.status === "Active") {
            await stopTracking();
        } else {
            await startBackgroundLocation();
        }

    };

    const formatSessionDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr ${remainingMinutes} min`;
    };




    return (
        <View style={styles.container}>
            <Text style={{ fontWeight: 'bold', color: 'gray', fontSize: 14, marginBottom: 4 }}>{today}</Text>

            <View style={styles.btnContainer}>
                {!attendancestatus?.checkOutTime && <View style={styles.textNdiconContainer}>
                    <Text style={{ fontWeight: 'bold', color: 'gray', fontSize: 16 }}>
                        {attendancestatus?.status === "Active" ? "Let's get to home" : "Let's get to work"}
                    </Text>
                    {attendancestatus?.status === "Active" ? (
                        <HomeIcon size={30} color={COLORS.DARK_GRAY} />
                    ) : (
                        <ShoppingBagIcon size={30} color={COLORS.DARK_GRAY} />
                    )}
                </View>
                }
                {attendancestatus?.checkOutTime ? (
                    <Text style={{ fontWeight: 'bold', color: COLORS.ACCENT_ORANGE, fontSize: 16, marginVertical: 12 }}>
                        Already done for today
                    </Text>
                ) : (
                    <TouchableOpacity
                        disabled={isSubmitting || !!attendancestatus?.checkOutTime}
                        style={[styles.button, (isSubmitting || attendancestatus?.checkOutTime) && { backgroundColor: 'gray' }]}
                        onPress={handlePress}
                    >
                        <Text style={styles.buttonText}>
                            {attendancestatus?.status === "Active" ? "Check Out" : "Check In"}
                        </Text>
                    </TouchableOpacity>
                )}


                <Text style={{ fontWeight: 'bold', color: 'gray', fontSize: 14 }}>
                    Your hours will be calculated here.
                </Text>

                {attendancestatus?.checkOutTime && (
                    <Text style={{ fontWeight: 'bold', color: COLORS.DARK_GRAY, fontSize: 14, marginTop: 8 }}>
                        Session Duration: {formatSessionDuration(attendancestatus?.sessionDuration || 0)}
                    </Text>
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
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        // Shadow for Android
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
    textNdiconContainer: {
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
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
