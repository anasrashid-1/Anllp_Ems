/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { CalendarIcon } from 'react-native-heroicons/solid';
import { ActivityIndicator } from 'react-native-paper';
import { Row, Table } from 'react-native-table-component';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmployeeLocation'>;

type RootStackParamList = {
    EmployeeLocation: { id: number };
};

interface Attendance {
    userId: number;
    username: string;
    attendanceId: number;
    checkInTime: string | null;
    checkOutTime: string | null;
    sessionDuration: string | null;
    createdAt: string | null;
    attendanceDate: string | null;
    status: string | null;
}

export default function AttendanceAdmin() {
    const [loading, setLoading] = useState<boolean>(false);
    const [showDate, setShowDate] = useState<boolean>(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('All');
    const [date, setDate] = useState<Date>(new Date());
    const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);

    const { apiUrl, token } = useContext(AuthContext);

    const data = [
        { label: 'All', value: 'All' },
        { label: 'Active', value: 'Active' },
        { label: 'Not Active', value: 'Not Active' },
        { label: 'Present', value: 'Present' },
        { label: 'Absent', value: 'Absent' },
        { label: 'On Leave', value: 'On Leave' },
        { label: 'Half Day', value: 'Half Day' },
    ];

    const navigation = useNavigation<NavigationProp>();
    const handleActionPress = (id: number) => {
        navigation.navigate('EmployeeLocation', { id });
    };

    const handleDateChange = (selectedDate: Date | undefined) => {
        setShowDate(false);
        if (!selectedDate) {
            setDate(new Date());
        } else {
            setDate(selectedDate);
        }
    };

    const formatSession = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours} hr ${remainingMinutes} min`;
    };

    const formatTime = (time: string | null) => {
        if (!time) { return 'N/A'; }
        const dateObj = new Date(time);
        return `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getFullYear()).slice(2)} ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
    };

    const fetchAttendance = async () => {
        const d = date ? new Date(date) : new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        let api = `${apiUrl}/attendance/status/?status=${selectedStatus}&date=${year}-${month}-${day}`;
        if (selectedStatus === 'All') {
            api = `${apiUrl}/attendance/status/?date=${year}-${month}-${day}`;
        }



        try {
            setLoading(true);
            const response = await fetch(
                api,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch attendance data.');
            }
            const result = await response.json();

            if (result.isError) {
                throw new Error(result.message || 'An error occurred.');
            }

            setAttendanceData(result.data || []);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedStatus, date]);

    // Filter out the columns we don't want to display
    const getDisplayColumns = (item: Attendance) => {
        const { createdAt, attendanceId, ...rest } = item;
        return rest;
    };

    // Create table headers from filtered columns
    const tableHead = attendanceData.length > 0
        ? Object.keys(getDisplayColumns(attendanceData[0])).map(key =>
            key.charAt(0).toUpperCase() + key.slice(1))
        : [];
    tableHead.push('Action');

    return (
        <View style={styles.screenContainer}>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
            ) : (
                <>
                    <View style={styles.cardsContainer}>
                        <View style={styles.card}>
                            <Text style={styles.cardValueText}>
                                {100}
                            </Text>
                            <Text style={styles.cardDescText}>Total</Text>
                            <Text style={styles.cardExtraText}>All Employees</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValueText}>
                                {100}
                            </Text>
                            <Text style={styles.cardDescText}>Present</Text>
                            <Text style={styles.cardExtraText}>Employees Present Today</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValueText}>
                                {0}
                            </Text>
                            <Text style={styles.cardDescText}>Onleave</Text>
                            <Text style={styles.cardExtraText}>Employees Onleave Today</Text>
                        </View>
                    </View>

                    <View style={styles.dateRangeContainer}>
                        <View style={styles.dateContainer}>
                            <Text style={styles.label}>Status</Text>
                            <Dropdown
                                style={styles.dropdown}
                                placeholderStyle={styles.placeholderStyle}
                                selectedTextStyle={styles.selectedTextStyle}
                                data={data}
                                labelField="label"
                                valueField="value"
                                placeholder="Filter"
                                value={selectedStatus}
                                onChange={(item) => {
                                    setSelectedStatus(item.value);
                                }}
                            />
                        </View>

                        <View style={styles.dateContainer}>
                            <Text style={styles.label}>Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowDate(true)}
                                style={styles.dateInputWrapper}
                            >
                                <TextInput
                                    style={styles.dateInput}
                                    value={date?.toLocaleDateString()}
                                    editable={false}
                                />
                                <CalendarIcon size={20} color={COLORS.ACCENT_ORANGE} />
                            </TouchableOpacity>
                            {showDate && (
                                <DateTimePicker
                                    value={date}
                                    mode="date"
                                    display="default"
                                    onChange={(event, selectedDate) => handleDateChange(selectedDate)}
                                />
                            )}
                        </View>
                    </View>
                    {attendanceData.length > 0 ? <ScrollView style={styles.container} horizontal>
                        <View>
                            <View style={styles.stickyHeaderContainer}>
                                <Table borderStyle={{ borderWidth: 2, borderColor: COLORS.DARK_GRAY }}>
                                    <Row data={tableHead} style={styles.head} textStyle={styles.text} widthArr={Array(tableHead.length).fill(150)} />
                                </Table>
                            </View>
                            <ScrollView>
                                {attendanceData.map((rowData, rowIndex) => (
                                    <View key={rowIndex} style={styles.row}>
                                        {Object.entries(getDisplayColumns(rowData)).map(([key, value], cellIndex) => {
                                            let formattedData = value;

                                            if (key === 'sessionDuration') {
                                                formattedData = formatSession(value as number);
                                            } else if (key === 'checkInTime' || key === 'checkOutTime') {
                                                formattedData = formatTime(value as string);
                                            }

                                            return (
                                                <View key={cellIndex} style={styles.cell}>
                                                    <Text style={styles.text}>{formattedData ?? 'N/A'}</Text>
                                                </View>
                                            );
                                        })}
                                        <View style={styles.cell}>
                                            <TouchableOpacity
                                                disabled={!rowData.checkInTime}
                                                style={[styles.button, { backgroundColor: !rowData.checkInTime ? COLORS.DARK_GRAY : COLORS.ACCENT_ORANGE }]}
                                                onPress={() => handleActionPress(rowData?.attendanceId)}
                                            >
                                                <Text style={styles.buttonText}>View</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    </ScrollView> :
                        <Text style={styles.placeholderText}>
                            📊 No data available. 🔍 Please adjust the filters and try again.
                        </Text>
                    }
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        paddingBottom: 0,
    },
    stickyHeaderContainer: {
        zIndex: 1,
        backgroundColor: 'white',
    },
    placeholderText: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
        marginTop: 50,
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: COLORS.DARK_GRAY,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',

        paddingVertical: 5,
        borderRadius: 5,
        width: 100,
    },
    buttonText: {
        color: 'white',
    },
    cell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: COLORS.DARK_GRAY,
    },
    container: { flex: 1 },
    head: { height: 40, backgroundColor: COLORS.ACCENT_ORANGE },
    text: { padding: 6, width: 100 },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        width: '100%',
    },
    selectedTextStyle: {
        color: 'gray',
        fontWeight: '300',
    },
    placeholderStyle: {
        color: 'gray',
        fontWeight: '300',
    },
    cardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    card: {
        width: '31%',
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        elevation: 5,
    },
    cardValueText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: 'gray',
    },
    cardDescText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.ACCENT_ORANGE,
        marginTop: 16,
    },
    cardExtraText: {
        fontSize: 10,
        color: 'gray',
    },
    label: {
        color: COLORS.DARK_GRAY,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    dateContainer: {
        width: '45%',
    },
    dateInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 1,
        paddingHorizontal: 8,
        borderColor: 'gray',
    },
    dateInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: 'gray',
    },
});
