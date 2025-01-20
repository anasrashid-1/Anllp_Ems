import DateTimePicker from '@react-native-community/datetimepicker';
import Geolocation from '@react-native-community/geolocation';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { CalendarIcon, CameraIcon, TrashIcon } from 'react-native-heroicons/solid';
import * as ImagePicker from 'react-native-image-picker';
import DialogComp from '../components/DialogComp';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import requestPermissions from '../util/requestPermissions';

const MAX_SIZE_KB = 300;

interface FormData {
    expenseDate: Date;
    expenseCategory: string | null;
    expenseDescription: string;
    amount: string;
    image: ImagePicker.ImageAsset | null;
}

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}

interface Location {
    latitude: number | null;
    longitude: number | null;
}

const AddExpenseScreen: React.FC = () => {
    const categoryData = [
        { label: 'Food', value: 'Food' },
        { label: 'Travel', value: 'Travel' },
        { label: 'Entertainment', value: 'Entertainment' },
        { label: 'Utilities', value: 'Utilities' },
    ];

    const [formData, setFormData] = useState<FormData>({
        expenseDate: new Date(),
        expenseCategory: null,
        expenseDescription: '',
        amount: '',
        image: null,
    });

    const authCtx = useContext(AuthContext);

    const [showDate, setShowDate] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const [dialogState, setDialogState] = useState<DialogState>({
        dialogVisible: false,
        dialogIcon: '',
        dialogMessage: '',
    });

    const descriptionRef = useRef<TextInput>(null);

    const [location, setLocation] = useState<Location>({ latitude: null, longitude: null });

    useEffect(() => {
        const requestPermissionAndFetchLocation = async () => {
            const hasPermissions = await requestPermissions();
            if (!hasPermissions) {
                Alert.alert('Permission Denied', 'Location permission is required to start tracking.');
                return;
            }

            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                },
                (error) => {
                    console.error(error);
                },
                { enableHighAccuracy: true, distanceFilter: 10 }
            );
        };

        requestPermissionAndFetchLocation();
    }, []);

    const handleDateChange = (selectedDate: Date | undefined) => {
        setFormData((prev) => ({
            ...prev,
            expenseDate: selectedDate || prev.expenseDate,
        }));
        setShowDate(false);
    };

    const showDialog = (message: string, icon: string) => {
        setDialogState({
            dialogMessage: message,
            dialogVisible: true,
            dialogIcon: icon,
        });
    };

    const handleSubmit = async () => {
        const { expenseDate, expenseCategory, expenseDescription, amount, image } = formData;

        if (!expenseCategory || !expenseDescription || !amount) {
            showDialog('All fields are required.', 'alert');
            return;
        }

        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            showDialog('Amount must be a valid number.', 'alert');
            return;
        }

        setIsSubmitting(true);

        const formDataToSend = new FormData();
        formDataToSend.append('expenseDate', expenseDate.toISOString().split('T')[0]);
        formDataToSend.append('expenseCategory', expenseCategory);
        formDataToSend.append('expenseDescription', expenseDescription);
        formDataToSend.append('latitude', location.latitude);
        formDataToSend.append('longitude', location.longitude);
        formDataToSend.append('amount', amount);

        if (image) {
            const imageData = {
                uri: image.uri,
                type: image.type || 'image/jpeg',
                name: image.fileName || 'image.jpg',
            };
            formDataToSend.append('file', imageData);
        }

        try {
            const response = await fetch(`${authCtx.apiUrl}/dailyexpenses/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authCtx.token}`,
                },
                body: formDataToSend,
            });

            const result = await response.json();
            if (response.ok) {
                showDialog(result.message || 'Expense added successfully.', 'check-circle');
                setFormData({
                    expenseDate: new Date(),
                    expenseCategory: null,
                    expenseDescription: '',
                    amount: '',
                    image: null,
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
    const pickImage = () => {
        ImagePicker.launchCamera({ mediaType: 'photo' }, (response) => {
            if (response.didCancel) {
                console.log('User canceled image picker');
            } else if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
            } else {
                if (response.assets && response.assets[0]) {
                    const image = response.assets[0];

                    // Log the image size in KB
                    console.log(`Image Size: ${image.fileSize / 1024} KB`);

                    // Check if image size exceeds the limit
                    if (image.fileSize > MAX_SIZE_KB * 1024) {
                        // Resize the image if it's larger than the limit (3 MB)
                        ImageResizer.createResizedImage(image.uri, 800, 800, 'JPEG', 70)
                            .then((resizedImage) => {
                                console.log(`Resized Image Size: ${resizedImage.size / 1024} KB`);
                                setFormData((prev) => ({
                                    ...prev,
                                    image: resizedImage,
                                }));
                            })
                            .catch((err) => {
                                console.error('Error resizing image:', err);
                            });
                    } else {
                        // Set the image without resizing if it's within the size limit
                        setFormData((prev) => ({
                            ...prev,
                            image,
                        }));
                    }
                }
            }
        });
    };

    const deleteImage = () => {
        setFormData((prev) => ({
            ...prev,
            image: null,
        }));
    };

    return (
        <ScrollView>
            <View style={styles.screenContainer}>
                <View style={styles.formContainer}>
                    <View>
                        <Text style={styles.label}>Expense Date</Text>
                        <TouchableOpacity onPress={() => setShowDate(true)} style={styles.dateInputWrapper}>
                            <TextInput
                                style={styles.dateInput}
                                value={formData.expenseDate.toLocaleDateString()}
                                editable={false}
                            />
                            <CalendarIcon size={20} color={COLORS.ACCENT_ORANGE} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dropdownContainer}>
                        <Text style={styles.label}>Expense Category</Text>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            data={categoryData}
                            labelField="label"
                            valueField="value"
                            placeholder="Select category"
                            value={formData.expenseCategory}
                            onChange={(item) => setFormData((prev) => ({ ...prev, expenseCategory: item.value }))}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            ref={descriptionRef}
                            style={[styles.input, { height: 100 }]}
                            multiline
                            value={formData.expenseDescription}
                            onChangeText={(text) => setFormData((prev) => ({ ...prev, expenseDescription: text }))}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            keyboardType="numeric"
                            style={styles.input}
                            value={formData.amount}
                            onChangeText={(text) => setFormData((prev) => ({ ...prev, amount: text }))}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Image</Text>
                        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                            <Text style={{ color: COLORS.DARK_GRAY }}>Take Photo</Text>
                            <CameraIcon size={20} color={COLORS.DARK_GRAY} />
                        </TouchableOpacity>

                        {formData.image && (
                            <View>
                                <Image
                                    source={{ uri: formData.image.uri }}
                                    style={styles.imagePreview}
                                    resizeMode="contain"
                                />
                                <TouchableOpacity onPress={deleteImage} style={styles.deleteButton}>
                                    <TrashIcon size={20} color={"red"} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        disabled={isSubmitting}
                        style={[styles.button, isSubmitting && { backgroundColor: 'gray' }]}
                        onPress={handleSubmit}
                    >
                        <Text style={styles.buttonText}>{isSubmitting ? 'Submitting...' : 'Submit'}</Text>
                    </TouchableOpacity>
                </View>

                {showDate && (
                    <DateTimePicker
                        value={formData.expenseDate}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => handleDateChange(selectedDate)}
                    />
                )}

                <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
            </View>
        </ScrollView>
    );
};

export default AddExpenseScreen;

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: COLORS.LIGHT_GRAY,
        padding: 12,
        paddingBottom: 0,
    },
    deleteButton: {
        position: 'absolute',
        top: -2,
        left: 60,
        padding: 5,
        borderRadius: 20,
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
        borderColor: COLORS.DARK_GRAY,
        borderWidth: 1,
    },
    dropdownContainer: {
        marginVertical: 15,
    },
    dropdown: {
        height: 50,
        borderColor: COLORS.DARK_GRAY,
        borderWidth: 0.5,
        borderRadius: 4,
        paddingHorizontal: 8,
        color: COLORS.DARK_GRAY,
    },
    selectedTextStyle: {
        color: 'black',
        fontSize: 16,
    },
    placeholderStyle: {
        color: COLORS.DARK_GRAY,
        fontSize: 16,
    },
    dateInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 4,
        borderWidth: 1,
        padding: 10,
        borderColor: COLORS.DARK_GRAY,
    },
    dateInput: {
        fontSize: 16,
        flex: 1,
    },
    input: {
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.DARK_GRAY,
        padding: 10,
        marginBottom: 15,
        borderRadius: 4,
    },
    imagePicker: {
        backgroundColor: COLORS.LIGHT_GRAY,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.DARK_GRAY,
        alignItems: 'center',
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: 'center',
        gap: 8,
    },
    button: {
        backgroundColor: COLORS.ACCENT_ORANGE,
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 4,
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: 'bold',
    },
    imagePreview: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 8,
    },
});

