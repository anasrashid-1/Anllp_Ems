import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import AdminListItem from '../components/DailyExpense/AdminListItem';
import DialogComp from '../components/DialogComp';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';

interface Expense {
    expenseID: number;
    amount: number;
    expenseCategory: string;
    expenseDate: string;
    expenseDescription: string;
    image: string;
    createdAt: string;
    updatedAt: string | null;
    userId: number;
    userName: string;
    status: string,
    approvedAt: string;
    approvedBy: number
    rejectedBy: number
    rejectedAt: string;
    rejectionReason: string
}

interface DialogState {
    dialogVisible: boolean;
    dialogIcon: string;
    dialogMessage: string;
}

const DailyExpenseAdmin: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
    const [expensesInfo, setExpensesInfo] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(false);
    const authCtx = useContext(AuthContext);
    const [uniqueUserNames, setUniqueUserNames] = useState<{ userName: string; userId: number }[]>([]);
    const [selectedUniqueUserName, setSelectedUniqueUserName] = useState<string>('');
    const [dialogState, setDialogState] = useState<DialogState>({
        dialogVisible: false,
        dialogIcon: '',
        dialogMessage: '',
    });

    const showDialog = (message: string, icon: string) => {
        setDialogState({
            dialogMessage: message,
            dialogVisible: true,
            dialogIcon: icon,
        });
    };

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${authCtx.apiUrl}/dailyexpenses`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authCtx.token}`,
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();

            if (response.ok) {
                const data: Expense[] = result.data;
                setExpensesInfo(result.amount);
                if (data.length > 0) {
                    setExpenses(data);
                    setFilteredExpenses(data); // Initialize filtered list with all data
                    const uniqueNames = data.reduce((acc: { userName: string; userId: number }[], current) => {
                        if (current.userName && !acc.some(item => item.userName === current.userName)) {
                            acc.push({ userName: current.userName, userId: current.userId });
                        }
                        return acc;
                    }, []);
                    setUniqueUserNames(uniqueNames);
                }
            } else {
                console.error('Failed to fetch expenses data', result.message);
                showDialog(result.message, 'alert');
            }
        } catch (error: any) {
            console.error('Error fetching expenses data:', error);
            showDialog(error.message, 'alert');
        } finally {
            setLoading(false);
        }
    };

    const filterRequestList = (userId: number) => {
        if (userId) {
            const filteredRequests = expenses.filter(item => item.userId === userId);
            setFilteredExpenses(filteredRequests);
        } else {
            setFilteredExpenses(expenses); // Reset to all expenses if no user is selected
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchExpenses();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [authCtx.userId, authCtx.token])
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
            ) : (
                <>
                    <View style={styles.cardsContainer}>
                        <View style={styles.card}>
                            <Text style={styles.cardValueText}>
                                {expensesInfo?.totalRequestedAmount ?? 'N/A'}
                            </Text>
                            <Text style={styles.cardDescText}>Total</Text>
                            <Text style={styles.cardExtraText}>All requested expenses</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValueText}>
                                {expensesInfo?.totalApprovedAmount ?? 'N/A'}
                            </Text>
                            <Text style={styles.cardDescText}>Approved</Text>
                            <Text style={styles.cardExtraText}>Expenses approved</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.cardValueText}>
                                {expensesInfo?.totalPendingAmount ?? 'N/A'}
                            </Text>
                            <Text style={styles.cardDescText}>Pending</Text>
                            <Text style={styles.cardExtraText}>Expenses awaiting approval</Text>
                        </View>
                    </View>

                    {/* User Filter Dropdown */}
                    <View style={styles.dropdownContainer}>
                        <Dropdown
                            style={styles.dropdown}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            data={uniqueUserNames}
                            search={true}
                            searchPlaceholder="Enter username to search"
                            labelField="userName"
                            valueField="userName"
                            placeholder="Filter by user"
                            value={selectedUniqueUserName}
                            onChange={(item) => {
                                setSelectedUniqueUserName(item.userName);
                                filterRequestList(item.userId);
                            }}
                        />
                    </View>

                    {/* Expense List */}
                    <FlatList
                        style={{ marginBottom: 150 }}
                        data={filteredExpenses}
                        keyExtractor={(item) => item.expenseID.toString()}
                        renderItem={({ item }) => <AdminListItem item={item} fetchExpenses={fetchExpenses} />}
                        contentContainerStyle={styles.listContainer}
                        ListEmptyComponent={
                            <Text style={styles.emptyText}>No expenses found. Start adding some!</Text>
                        }
                    />
                </>
            )}
            <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
        </View>
    );
};

export default DailyExpenseAdmin;

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.LIGHT_GRAY,
        padding: 16,
    },
    listContainer: {
        paddingBottom: 20,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.DARK_GRAY,
        marginTop: 50,
        fontSize: 16,
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
    dropdownContainer: {
        marginTop: 10,
        marginBottom: 5,
    },
    dropdown: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 0.5,
        borderRadius: 8,
        paddingHorizontal: 8,

    },
    selectedTextStyle: {
        color: 'gray',
        fontWeight: 300,
    },
    placeholderStyle: {
        color: 'gray',
        fontWeight: 300,
    },
});
