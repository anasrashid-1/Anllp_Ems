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

    console.log("MarkAttendance attendancestatus:", attendancestatus);

    const handlePress = async () => {

        if (attendancestatus === "Active") {
            await stopTracking();
        } else {
            await startBackgroundLocation();
        }

    };



    return (
        <View style={styles.container} >

            <Text style={{ fontWeight: 'bold', color: 'gray', fontSize: 14, marginBottom: 4 }} >{today}</Text>

            <View style={styles.btnContainer}>
                <View style={styles.textNdiconContainer}>
                    <Text style={{ fontWeight: 'bold', color: 'gray', fontSize: 16 }} > {attendancestatus === "Active" ? "Lets get to home" : "Lets get to work"}</Text>

                    {attendancestatus === "Active" ? <HomeIcon size={30} color={COLORS.DARK_GRAY} /> : <ShoppingBagIcon size={30} color={COLORS.DARK_GRAY} />}

                </View>

                <TouchableOpacity
                    disabled={isSubmitting}
                    style={[styles.button, isSubmitting && { backgroundColor: 'gray' }]}
                    onPress={handlePress}
                >
                    <Text style={styles.buttonText}>{attendancestatus === "Active" ? "Check Out" : "Check IN"}</Text>
                </TouchableOpacity>
                <Text style={{ fontWeight: 'bold', color: 'gray', fontSize: 14 }} >Your hours will be calculated here.</Text>
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
        alignItems: 'center',
        marginVertical: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
