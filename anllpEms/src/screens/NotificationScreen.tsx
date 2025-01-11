import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import COLORS from '../constants/colors';

export default function NotificationScreen() {
    const [notifications, setNotifications] = useState([]);

    if (notifications.length === 0) {
        return (
            <View style={[styles.screenContainer, { height: '100%', padding: 12 }]}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                        📭 No notifications found. Please check back later!
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.screenContainer}>
            <Text>NotificationScreen</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        backgroundColor: 'white',
        flex: 1,
        padding: 12,
        paddingBottom: 0,
    },
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    placeholderText: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
        marginBottom: 8,
    },
});
