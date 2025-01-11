import React, { useContext, useState } from 'react';
import { StyleSheet, View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import {CalendarIcon} from 'react-native-heroicons/solid';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';
import DialogComp from '../components/DialogComp';

interface FormData {
    subject: string;
    leaveType: string | null;
    startDate: Date;
    endDate: Date;
}

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}

const AddLeaveScreen: React.FC = () => {
    const data = [
        { label: 'Sick Leave', value: 'Sick Leave' },
        { label: 'Casual Leave', value: 'Casual Leave' },
    ];

    const [formData, setFormData] = useState<FormData>({
        subject: '',
        leaveType: null,
        startDate: new Date(),
        endDate: new Date(),
    });

    const authCtx = useContext(AuthContext);

    const [showStartDate, setShowStartDate] = useState<boolean>(false);
    const [showEndDate, setShowEndDate] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [dialogState, setDialogState] = useState<DialogState>({
        dialogVisible: false,
        dialogIcon: '',
        dialogMessage: '',
    });

    // Date picker handlers
    const handleDateChange = (key: 'startDate' | 'endDate', selectedDate: Date | undefined) => {
        setFormData((prev) => ({
            ...prev,
            [key]: selectedDate || prev[key],
        }));
        key === 'startDate' ? setShowStartDate(false) : setShowEndDate(false);
    };

    // Show dialog
    const showDialog = (message: string, icon: string) => {
        setDialogState({
            dialogMessage: message,
            dialogVisible: true,
            dialogIcon: icon,
        });
    };

    // Handle form submission
    const handleSubmit = async () => {
        const { subject, leaveType, startDate, endDate } = formData;

        if (!subject || !leaveType) {
            showDialog('All fields are required.', 'alert');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showDialog('End date must be after start date.', 'alert');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${authCtx.apiUrl}/leaveapplication`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authCtx.token}`,
                },
                body: JSON.stringify({
                    subject,
                    leaveType,
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                }),
            });

            const result = await response.json();

            if (response.ok) {
                showDialog(result.message || 'Leave application submitted successfully.', 'check-circle');
                setFormData({
                    subject: '',
                    leaveType: null,
                    startDate: new Date(),
                    endDate: new Date(),
                });
            } else {
                showDialog(result.message || 'Something went wrong.', 'alert');
            }
        } catch (error: any) {
            showDialog(error.message || 'Something went wrong', 'alert');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.screenContainer}>
            <View style={styles.formContainer}>
                <View>
                    <Text style={styles.label}>Subject</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={{ height: 100 }}
                            autoCapitalize="none"
                            keyboardType="default"
                            placeholder="Enter reason for application."
                            multiline
                            textAlignVertical="top"
                            value={formData.subject}
                            onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, subject: text }))
                            }
                        />
                    </View>
                </View>

                <View style={styles.dropdownContainer}>
                    <Text style={styles.label}>Leave Type</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        data={data}
                        labelField="label"
                        valueField="value"
                        placeholder="Select item"
                        value={formData.leaveType}
                        onChange={(item) =>
                            setFormData((prev) => ({ ...prev, leaveType: item.value }))
                        }
                    />
                </View>

                <View style={styles.dateRangeContainer}>
                    <View style={styles.dateContainer}>
                        <Text style={styles.label}>Start Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowStartDate(true)}
                            style={styles.dateInputWrapper}
                        >
                            <TextInput
                                style={styles.dateInput}
                                value={formData.startDate.toLocaleDateString()}
                                editable={false}
                            />

                            <CalendarIcon size={20} color={COLORS.ACCENT_ORANGE} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateContainer}>
                        <Text style={styles.label}>End Date</Text>
                        <TouchableOpacity
                            onPress={() => setShowEndDate(true)}
                            style={styles.dateInputWrapper}
                        >
                            <TextInput
                                style={styles.dateInput}
                                value={formData.endDate.toLocaleDateString()}
                                editable={false}
                            />
                            <CalendarIcon size={20} color={COLORS.ACCENT_ORANGE} />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    disabled={isSubmitting}
                    style={[styles.button, isSubmitting && { backgroundColor: 'gray' }]}
                    onPress={handleSubmit}
                >
                    <Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>
            </View>

            {showStartDate && (
                <DateTimePicker
                    value={formData.startDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => handleDateChange('startDate', selectedDate)}
                />
            )}
            {showEndDate && (
                <DateTimePicker
                    value={formData.endDate}
                    mode="date"

                    display="default"
                    onChange={(event, selectedDate) => handleDateChange('endDate', selectedDate)}
                />
            )}

            {/* for dialog */}
            <DialogComp dialogState={dialogState} setDialogState={setDialogState}/>

        </View>
    );
};

export default AddLeaveScreen;

// Add your styles here

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        paddingBottom: 0,
    },
    formContainer: {
        marginBottom: 20,
    },
    label: {
        color: COLORS.DARK_GRAY,
        marginBottom: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    inputWrapper: {
        borderRadius: 4,
        borderColor: 'gray',
        borderWidth: 1,
    },
    dropdownContainer: {
        marginVertical: 15,
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 4,
        paddingHorizontal: 8,
        // borderWidth: 1,
        color: 'gray',
    },
    selectedTextStyle: {
        color: 'black',
        fontSize: 16,
    },
    placeholderStyle: {
        color: 'gray',
        fontSize: 16,
    },

    dateRangeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
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

    button: {
        marginTop: 16,
        backgroundColor: COLORS.ACCENT_ORANGE,
        paddingVertical: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
