/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Linking,
    SafeAreaView,
    Platform,
    ScrollView,
    Modal,
} from 'react-native';
import { AuthContext } from '../store/auth-context';
import DialogComp from '../components/DialogComp';
import COLORS from '../constants/colors';
import {

    MagnifyingGlassIcon,
    IdentificationIcon,
    UserIcon,
    UsersIcon,
    MapPinIcon,
    PhoneIcon,
    DocumentTextIcon,
    MapIcon,
    ExclamationCircleIcon,
    StarIcon
} from 'react-native-heroicons/solid';
import Pdf from 'react-native-pdf';

interface Grower {
    id: number;
    growerName: string;
    ParentName: string;
    address: string;
    contactNo: string;
    latitude: string | null;
    longitude: string | null;
    pdfLink: string | null;
}

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}

export default function Growerdetails() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [id, setId] = useState('');
    const [growers, setGrowers] = useState<Grower[]>([]);
    const [selectedGrower, setSelectedGrower] = useState<Grower | null>(null);
    const [pdfModalVisible, setPdfModalVisible] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [dialogState, setDialogState] = useState<DialogState>({
        dialogVisible: false,
        dialogIcon: '',
        dialogMessage: '',
    });

    const handleOpenPDF = (pdfLink: string | null) => {
        if (pdfLink) {
            setPdfModalVisible(true);
        } else {
            showDialog('PDF is not available.', 'error');
        }
    };

    const closePdfModal = () => {
        setPdfModalVisible(false);
    };

    const authCtx = useContext(AuthContext);

    const showDialog = (message: string, icon: string) => {
        setDialogState({
            dialogMessage: message,
            dialogVisible: true,
            dialogIcon: icon,
        });
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            if (name.trim()) {
                fetchGrowerByName();
            } else {
                clearStates();
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [name]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (id.trim()) {
                fetchGrowerById();
            } else {
                clearStates();
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [id]);

    const clearStates = () => {
        setGrowers([]);
        setNotFound(false);
    };

    const fetchGrowerByName = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${authCtx.apiUrl}/growerdetails/get?name=${name}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authCtx.token}`,
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();

            if (response.ok) {
                if (result.data.length > 0) {
                    setGrowers(result.data);
                    setNotFound(false);
                } else {
                    clearStates();
                    setNotFound(true);
                    setSelectedGrower(null);
                }
            } else {
                showDialog(result.message, 'alert');
                clearStates();
                setSelectedGrower(null);
            }
        } catch (error: any) {
            showDialog(error.message, 'alert');
            clearStates();
            setSelectedGrower(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchGrowerById = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${authCtx.apiUrl}/growerdetails/get?id=${id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authCtx.token}`,
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();

            if (response.ok) {
                if (result.data.length > 0) {
                    setSelectedGrower(result.data[0]);
                    setNotFound(false);
                } else {
                    clearStates();
                    setNotFound(true);
                    setSelectedGrower(null);
                }
            } else {
                showDialog(result.message, 'alert');
                clearStates();
                setSelectedGrower(null);
            }
        } catch (error: any) {
            showDialog(error.message, 'alert');
            clearStates();
            setSelectedGrower(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGrowerSelect = (grower: Grower) => {
        setSelectedGrower(grower);
        setGrowers([]);
        setName('');
        setId('');
    };

    const handleGetDirections = (latitude: string, longitude: string) => {
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        Linking.openURL(url).catch(() =>
            showDialog('Unable to open Google Maps', 'error')
        );
    };

    const renderGrowerSuggestion = ({ item }: { item: Grower }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleGrowerSelect(item)}
        >
            <UserIcon size={20} color={COLORS.ACCENT_ORANGE} />
            <Text style={styles.suggestionText}>{item.growerName}</Text>
        </TouchableOpacity>
    );


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <MagnifyingGlassIcon size={20} color={COLORS.DARK_GRAY} />
                        <TextInput
                            style={styles.input}
                            placeholder="Search by Name"
                            value={name}
                            onChangeText={(text) => setName(text)}
                            placeholderTextColor={COLORS.DARK_GRAY}
                        />
                    </View>

                    <View style={styles.searchBox}>
                        <IdentificationIcon size={20} color={COLORS.DARK_GRAY} />
                        <TextInput
                            style={styles.input}
                            placeholder="Search by ID"
                            value={id}
                            onChangeText={(text) => setId(text)}
                            keyboardType="numeric"
                            placeholderTextColor={COLORS.DARK_GRAY}
                        />
                    </View>
                </View>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
                    </View>
                )}

                {growers.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>Suggestions</Text>
                        <FlatList
                            data={growers}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderGrowerSuggestion}
                            style={styles.suggestionsList}
                            scrollEnabled={false}
                        />
                    </View>
                )}

                {notFound && (
                    <View style={styles.placeholder}>
                        <ExclamationCircleIcon size={48} color={COLORS.DARK_GRAY} />
                        <Text style={styles.placeholderText}>No grower found</Text>
                    </View>
                )}

                {selectedGrower && (
                    <View style={styles.selectedGrower}>
                        <Text style={styles.detailsTitle}>Grower Information</Text>

                        <View style={styles.detailRow}>
                            <StarIcon size={20} color={COLORS.ACCENT_ORANGE} />
                            <View style={styles.detailContent}>
                                <Text style={styles.label}>ID</Text>
                                <Text style={styles.value}>{selectedGrower.id}</Text>
                            </View>
                        </View>
                        <View style={styles.detailRow}>
                            <UserIcon size={20} color={COLORS.ACCENT_ORANGE} />
                            <View style={styles.detailContent}>
                                <Text style={styles.label}>Name</Text>
                                <Text style={styles.value}>{selectedGrower.growerName}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <UsersIcon size={20} color={COLORS.ACCENT_ORANGE} />
                            <View style={styles.detailContent}>
                                <Text style={styles.label}>Parent Name</Text>
                                <Text style={styles.value}>{selectedGrower.ParentName}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <MapPinIcon size={20} color={COLORS.ACCENT_ORANGE} />
                            <View style={styles.detailContent}>
                                <Text style={styles.label}>Address</Text>
                                <Text style={styles.value}>{selectedGrower.address}</Text>
                            </View>
                        </View>

                        <View style={styles.detailRow}>
                            <PhoneIcon size={20} color={COLORS.ACCENT_ORANGE} />
                            <View style={styles.detailContent}>
                                <Text style={styles.label}>Contact</Text>
                                <Text style={styles.value}>{selectedGrower.contactNo}</Text>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, !selectedGrower.pdfLink && styles.disabledButton]}
                                onPress={() => handleOpenPDF(selectedGrower.pdfLink!)}
                                disabled={!selectedGrower.pdfLink}
                            >
                                <DocumentTextIcon size={20} color="white" />
                                <Text style={styles.buttonText}>View PDF</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    (!selectedGrower.latitude || !selectedGrower.longitude) && styles.disabledButton,
                                ]}
                                onPress={() => handleGetDirections(selectedGrower.latitude!, selectedGrower.longitude!)}
                                disabled={!selectedGrower.latitude || !selectedGrower.longitude}
                            >
                                <MapIcon size={20} color="white" />
                                <Text style={styles.buttonText}>Get Directions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>

            <Modal
                visible={pdfModalVisible}
                animationType="slide"
                onRequestClose={closePdfModal}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={closePdfModal}>
                            <Text style={styles.modalCloseButton}>Close</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedGrower && selectedGrower.pdfLink ? (
                        <Pdf
                            source={{ uri: selectedGrower.pdfLink, cache: true }}
                            onLoadComplete={(numberOfPages) => {
                                console.log(`Number of pages: ${numberOfPages}`);
                            }}
                            onError={(error) => {
                                console.error(error);
                                showDialog('Failed to load PDF.', 'error');
                            }}
                            onLoadProgress={(percent) => {
                                console.log(`Loading progress: ${percent}%`);
                            }}
                            style={styles.pdf}
                        />
                    ) : (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
                            <Text>Loading PDF...</Text>
                        </View>
                    )}
                </SafeAreaView>
            </Modal>

            <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    modalHeader: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
    },
    modalCloseButton: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.ACCENT_ORANGE,
    },
    pdf: {
        flex: 1,
        margin: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    scrollView: {
        flex: 1,
    },
    headerContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.DARK_GRAY,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
        marginTop: 4,
    },
    searchContainer: {
        padding: 16,
        gap: 12,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eeeeee',
        paddingHorizontal: 12,
        gap: 8,
    },
    input: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: COLORS.DARK_GRAY,
    },
    suggestionsContainer: {
        padding: 16,
    },
    suggestionsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.DARK_GRAY,
        marginBottom: 8,
    },
    suggestionsList: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
    },
    suggestionItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eeeeee',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    suggestionText: {
        fontSize: 16,
        color: COLORS.DARK_GRAY,
        flex: 1,
    },
    placeholder: {
        padding: 32,
        alignItems: 'center',
        gap: 8,
    },
    placeholderText: {
        fontSize: 16,
        color: COLORS.DARK_GRAY,
    },
    selectedGrower: {
        margin: 16,
        padding: 16,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eeeeee',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    detailsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.DARK_GRAY,
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    detailContent: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: COLORS.DARK_GRAY,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: COLORS.DARK_GRAY,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: COLORS.ACCENT_ORANGE,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    disabledButton: {
        backgroundColor: COLORS.DARK_GRAY,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
});
