import React, { useContext, useState } from 'react';
import {
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from 'react-native-paper';
import COLORS from '../../constants/colors';
import { AuthContext } from '../../store/auth-context';
import { formatTime } from '../../util/formatTime';
import DialogComp from '../DialogComp';

interface ListItemProps {
    item: {
        expenseID: number;
        amount: number;
        expenseCategory: string;
        expenseDate: string;
        expenseDescription: string;
        image: string;
        createdAt: string;
        updatedAt: string | null;
        userId: number;
        status: string,
        approvedAt: string;
        approvedBy: number
        rejectedBy: number
        rejectedAt: string;
        rejectionReason: string
    };
    fetchExpenses: () => void;
}

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}

export default function AdminListItem({ item, fetchExpenses }: ListItemProps) {
    const [isModalVisible, setModalVisible] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [dialogState, setDialogState] = useState<DialogState>({
        dialogVisible: false,
        dialogIcon: '',
        dialogMessage: '',
    });
    const [remarks, setRemarks] = useState<string>(''); // State for remarks input
    const [modalAction, setModalAction] = useState<string>(''); // Store the current action
    const authCtx = useContext(AuthContext);

    const showDialog = (message: string, icon: string) => {
        setDialogState({
            dialogMessage: message,
            dialogVisible: true,
            dialogIcon: icon,
        });
    };




    const handleAction = async (expenseID: number, action: string) => {
        try {
            if (action === 'Rejected' && !remarks.trim()) {
                showDialog('Please provide a reason for rejection.', 'alert');
                return;
            }

            const body = {
                expenseID,
                action,
                ...(action === 'Rejected' ? { rejectionReason: remarks.trim() } : {}),
            };

            const response = await fetch(`${authCtx.apiUrl}/dailyexpenses`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${authCtx.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (response.ok) {
                showDialog(
                    `Request ${action === 'approved' ? 'approved' : 'rejected'} successfully!`,
                    'check-circle'
                );
                fetchExpenses();
            } else {
                const result = await response.json();
                showDialog(result.message || 'Failed to update the request.', 'alert');
            }
        } catch (error: any) {
            showDialog(error.message || 'An unexpected error occurred.', 'alert');
        } finally {
            setModalVisible(false);
            setRemarks('');
        }
    };

    const toggleModal = (action: string) => {
        setModalAction(action);
        setModalVisible(!isModalVisible);
    };




    return (
        <View style={styles.cardContainer}>
            {/* Main Content */}
            <View style={styles.mainSection}>
                {/* Left Section - Image */}
                <TouchableOpacity
                    style={styles.imageSection}
                    onPress={() => setImageModalVisible(true)}
                >
                    <Image
                        source={{ uri: item.image }}
                        style={styles.expenseImage}
                    />
                </TouchableOpacity>

                {/* Right Section - Details */}
                <View style={styles.detailsSection}>
                    <View style={styles.headerRow}>
                        <Text style={styles.expenseCategory}>{item.expenseCategory}</Text>
                        <Text style={styles.expenseAmount}>₹{item.amount}</Text>
                    </View>

                    <Text style={styles.expenseDate}>
                        {new Date(item.expenseDate).toLocaleDateString()}
                    </Text>

                    <Text style={styles.expenseDescription} numberOfLines={2}>
                        {item.expenseDescription}
                    </Text>

                    {/* Status Badge */}
                    <Text style={[
                        styles.statusBadge,
                        item.status === "Approved" ? styles.approvedBadge :
                            item.status === "Rejected" ? styles.rejectedBadge :
                                styles.pendingBadge
                    ]}>
                        {item.status}
                    </Text>
                </View>
            </View>

            {/* Status Details */}
            {(item.status === "Approved" || item.status === "Rejected") && (
                <View style={styles.statusDetails}>
                    {item.status === "Approved" && (
                        <Text style={styles.statusInfo}>
                            Approved at: {formatTime(item.approvedAt)} by {item.approvedBy}
                        </Text>
                    )}
                    {item.status === "Rejected" && (
                        <>
                            <Text style={styles.statusInfo}>
                                Rejected at: {formatTime(item.rejectedAt)} by {item.rejectedBy}
                            </Text>
                            <Text style={styles.rejectionReason}>
                                Reason: {item.rejectionReason}
                            </Text>
                        </>
                    )}
                </View>
            )}

            {/* Action Buttons */}
            {item.status === "Pending" && (
                <View style={styles.buttonContainer}>
                    <Button
                        mode="contained"
                        onPress={() => toggleModal('Rejected')}
                        style={[styles.actionButton, styles.rejectButton]}
                        labelStyle={styles.buttonLabel}
                    >
                        Reject
                    </Button>
                    <Button
                        mode="contained"
                        onPress={() => handleAction(item.expenseID, 'Approved')}
                        style={[styles.actionButton, styles.approveButton]}
                        labelStyle={styles.buttonLabel}
                    >
                        Approve
                    </Button>
                </View>
            )}
            {/* Modals */}
            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {modalAction === 'Approved' ? 'Approve' : 'Reject'} Expense
                        </Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter remarks"
                            value={remarks}
                            onChangeText={setRemarks}
                            multiline
                        />
                        <View style={styles.modalButtonContainer}>
                            <Button
                                mode="contained"
                                onPress={() => {
                                    setModalVisible(false);
                                    setRemarks('');
                                }}
                                style={styles.cancelButton}
                                labelStyle={styles.buttonLabel}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => modalAction && handleAction(item.expenseID, 'Rejected')}
                                style={styles.confirmButton}
                                labelStyle={styles.buttonLabel}
                            >
                                Confirm
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={imageModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Image
                            source={{ uri: item.image }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setImageModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
        </View>
    );
}

const styles = StyleSheet.create({
    cardContainer: {
        marginVertical: 6,
        marginHorizontal: 2,
        backgroundColor: COLORS.WHITE,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        padding: 12,
    },
    mainSection: {
        flexDirection: 'row',
        gap: 12,
    },
    imageSection: {
        width: 100,
    },
    expenseImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    detailsSection: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    expenseCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.DARK_GRAY,
        flex: 1,
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.ACCENT_ORANGE,
    },
    expenseDate: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    expenseDescription: {
        fontSize: 13,
        color: COLORS.DARK_GRAY,
        marginTop: 4,
        lineHeight: 18,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 2,
        paddingHorizontal: 8,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    approvedBadge: {
        backgroundColor: '#E6F4EA',
        color: '#52C41A',
    },
    rejectedBadge: {
        backgroundColor: '#FFF1F0',
        color: '#FF4D4F',
    },
    pendingBadge: {
        backgroundColor: '#FFF7E6',
        color: '#FA8C16',
    },
    statusDetails: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statusInfo: {
        fontSize: 13,
        color: '#666',
    },
    rejectionReason: {
        fontSize: 13,
        color: '#FF4D4F',
        fontWeight: '500',
        marginTop: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        flex: 1,
        borderRadius: 8,
        height: 36,
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButton: {
        backgroundColor: '#FF4D4F',
    },
    approveButton: {
        backgroundColor: '#52C41A',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        backgroundColor: COLORS.WHITE,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.DARK_GRAY,
        marginBottom: 16,
    },
    textInput: {
        width: '100%',
        height: 120,
        borderColor: '#E8E8E8',
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        textAlignVertical: 'top',
        marginBottom: 20,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: COLORS.ACCENT_ORANGE,
        borderRadius: 12,
        height: 45,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        height: 45,
    },
    modalImage: {
        width: '100%',
        height: 300,
        borderRadius: 12,
        marginBottom: 20,
    },
    closeButton: {
        backgroundColor: COLORS.ACCENT_ORANGE,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    closeButtonText: {
        color: COLORS.WHITE,
        fontSize: 16,
        fontWeight: '600',
    },
})