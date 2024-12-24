import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

const ColorStatus = () => {
    return (
        <View style={styles.statusContainer}>
            <View style={styles.statusCard}>
                <View style={[styles.colorDot, { backgroundColor: 'blue' }]} />
                <Text style={styles.statusText}>Present</Text>
            </View>
            <View style={styles.statusCard}>
                <View style={[styles.colorDot, { backgroundColor: 'red' }]} />
                <Text style={styles.statusText}>Absent</Text>
            </View>
            <View style={styles.statusCard}>
                <View style={[styles.colorDot, { backgroundColor: 'orange' }]} />
                <Text style={styles.statusText}>Half Day</Text>
            </View>
            <View style={styles.statusCard}>
                <View style={[styles.colorDot, { backgroundColor: 'green' }]} />
                <Text style={styles.statusText}>Leave</Text>
            </View>
            <View style={styles.statusCard}>
                <View style={[styles.colorDot, { backgroundColor: 'gray' }]} />
                <Text style={styles.statusText}>Weekend</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    statusContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',

        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        elevation: 5,
        padding: 12,
        backgroundColor: 'white',
        marginBottom: 10,

    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '33%',
    },
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 5,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: 'gray',
        fontWeight: 'bold',
    },
});


export default ColorStatus
