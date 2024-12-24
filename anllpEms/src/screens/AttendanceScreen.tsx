import React from 'react';
import { StyleSheet, View } from 'react-native';
import WorkingDaysCard from '../components/AttendanceScreen/WorkingDaysCard';
import CalendarContainer from '../components/AttendanceScreen/CalendarContainer';
import ColorStatus from '../components/AttendanceScreen/ColorStatus';

const AttendanceScreen = () => {
    return (
        <View style={styles.screenContainer}>
            <ColorStatus/>
            <CalendarContainer/>
            <WorkingDaysCard/>
        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        backgroundColor: 'white',
        flex: 1,
        padding: 12,
        paddingBottom: 0,
    },
});

export default AttendanceScreen;
