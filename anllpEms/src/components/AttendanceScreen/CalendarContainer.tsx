import React, { useContext, useEffect, useState } from 'react'
import { Calendar } from 'react-native-calendars';
import { StyleSheet, View } from 'react-native';
import { AuthContext } from '../../store/auth-context';
import DialogComp from '../DialogComp';
import { ActivityIndicator } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';

interface AttendanceRecord {
    attendanceId: number;
    checkInTime: string;
    checkOutTime: string;
    status: string;
    sessionDuration: number;
    attendanceDate: string;
}

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}

const CalendarContainer = () => {
    const currentDate = new Date();
    const initialDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const isFocused = useIsFocused();

    const useCtx = useContext(AuthContext)
    const [loading, setLoading] = useState<boolean>(true);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [markedDates, setMarkedDates] = useState<{ [key: string]: any }>({});
    const [dialogState, setDialogState] = useState<DialogState>({
        dialogVisible: false,
        dialogIcon: "",
        dialogMessage: "",
    });

    const showDialog = (message: string, icon: string) => {
        setDialogState({
            dialogMessage: message,
            dialogVisible: true,
            dialogIcon: icon,
        });
    };

    // Helper function to get all past dates until current date
    const getPastDates = (startDate: string) => {
        const dates: string[] = [];
        let currentDate = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        while (currentDate <= today) {
            dates.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    useEffect(() => {
        const getAttendanceRecordData = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${useCtx.apiUrl}/attendance/user`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${useCtx.token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                const result = await res.json();
                if (res.ok) {
                    const data: AttendanceRecord[] = result.data;
                    setAttendanceData(data);

                    // Get all past dates until today
                    const pastDates = getPastDates('2024-11-01');
                    const marks: { [key: string]: any } = {};

                    // Mark past dates and Sundays
                    pastDates.forEach(date => {
                        const dayOfWeek = new Date(date).getDay();
                        if (dayOfWeek === 0) { // Sunday
                            marks[date] = {
                                customStyles: {
                                    container: {
                                        backgroundColor: 'gray',
                                        borderRadius: 8,
                                    },
                                    text: {
                                        color: 'white'
                                    }
                                }
                            };
                        } else {
                            marks[date] = {
                                customStyles: {
                                    container: {
                                        backgroundColor: 'red',
                                        borderRadius: 8,
                                    },
                                    text: {
                                        color: 'white'
                                    }
                                }
                            };
                        }
                    });

                    // Mark future Sundays
                    let futureDate = new Date();
                    const endDate = new Date('2025-11-01');
                    while (futureDate <= endDate) {
                        if (futureDate.getDay() === 0) { // Sunday
                            const dateString = futureDate.toISOString().split('T')[0];
                            marks[dateString] = {
                                customStyles: {
                                    container: {
                                        backgroundColor: 'gray',
                                        borderRadius: 8,
                                    },
                                    text: {
                                        color: 'white'
                                    }
                                }
                            };
                        }
                        futureDate.setDate(futureDate.getDate() + 1);
                    }

                    // Override with attendance data
                    let color : string;
                    data.forEach((record) => {
                        
                        if (record.status === 'Not Active' && record.sessionDuration < 360) {
                            color = 'orange';
                        } else if (record.status === 'Not Active' && record.sessionDuration > 360) {
                            color = 'blue';
                        } else if (record.status === 'Active') {
                            color = 'lightblue';
                        } else if (record.status === 'On Leave') {
                            color = 'green';
                        }
                        


                        marks[record.attendanceDate] = {
                            customStyles: {
                                container: {
                                    backgroundColor: color,
                                    borderRadius: 8,
                                },
                                text: {
                                    color: 'white'
                                }
                            }
                        };
                    });

                    setMarkedDates(marks);
                } else {
                    console.error('Failed to fetch leave data', result.message);
                    showDialog(result.message, "alert");
                }
            } catch (error: any) {
                console.error('Error fetching leave data:', error);
                showDialog(error.message, "alert");
            } finally {
                setLoading(false);
            }
        }

        getAttendanceRecordData();
    }, [isFocused])

    return (
        <View>
            {loading ? <View style={styles.loadingContainer}>
                <ActivityIndicator animating={true} size={'large'} color={'gray'} />
            </View> : <>
                <View style={styles.calendarContainer}>
                    <Calendar
                        style={{
                            height: 350,
                            borderRadius: 8,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 3.5,
                            elevation: 5,
                        }}
                        initialDate={initialDate}
                        minDate={'2024-12-01'}
                        maxDate={'2025-11-01'}
                        markedDates={markedDates}
                        markingType={'custom'}
                    />
                </View>
                <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
            </>}
        </View>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        height: 360,
        justifyContent: "center",
        alignItems: 'center',
    },
    calendarContainer: {
        marginBottom: 10,
    },
});

export default CalendarContainer