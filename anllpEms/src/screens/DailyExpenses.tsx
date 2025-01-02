import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ListItem from '../components/DailyExpense/ListItem';
import DialogComp from '../components/DialogComp';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';
import { Dropdown } from 'react-native-element-dropdown';

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
  status: string; // Add a status field for the expense
}

interface DialogState {
  dialogVisible: boolean;
  dialogIcon: string;
  dialogMessage: string;
}

const DailyExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]); // State for filtered expenses
  const [expensesInfo, setExpensesInfo] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('All'); // Selected status for filter
  const authCtx = useContext(AuthContext);
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

  const filterExpenses = (status: string) => {
    if (status === 'All') {
      setFilteredExpenses(expenses); // Show all expenses
    } else {
      const filtered = expenses.filter(expense => expense.status === status); // Filter by status
      setFilteredExpenses(filtered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchExpenses = async () => {
        try {
          setLoading(true); // Start loading
          const response = await fetch(`${authCtx.apiUrl}/dailyexpenses/${authCtx.userId}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${authCtx.token}`,
              'Content-Type': 'application/json',
            },
          });
          const result = await response.json();
          setExpensesInfo(result.amount);

          if (response.ok) {
            const data: Expense[] = result.data;
            setExpenses(data);
            setFilteredExpenses(data); // Initialize filtered expenses with all expenses
          } else {
            console.error('Failed to fetch expenses data', result.message);
            showDialog(result.message, 'alert');
          }
        } catch (error: any) {
          console.error('Error fetching expenses data:', error);
          showDialog(error.message, 'alert');
        } finally {
          setLoading(false); // Stop loading
        }
      };

      fetchExpenses();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authCtx.userId, authCtx.token])
  );

  const data = [
    { label: 'Pending', value: 'Pending' },
    { label: 'Approved', value: 'Approved' },
    { label: 'Rejected', value: 'Rejected' },
    { label: 'All', value: 'All' },
  ];

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      ) : (
        <View style={{
          flex: 1,
        }}>


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

          <View style={styles.requestListHeaderContainer}>
            <Text style={styles.requestListHeaderText}>Expense List</Text>

            <View style={styles.dropdownContainer}>
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
                  filterExpenses(item.value);
                }}
              />
            </View>
          </View>

          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.expenseID.toString()}
            renderItem={({ item }) => <ListItem item={item} />}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No expenses found. Start adding some!</Text>
            }
          />

        </View>

      )
      }
      <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
    </View >
  );
};

export default DailyExpenses;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.DARK_GRAY,
    marginTop: 50,
    fontSize: 16,
  },
  requestListHeaderContainer: {
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestListHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'gray',
  },
  dropdownContainer: {
    width: '40%',
  },
  dropdown: {
    borderColor: 'gray',
    borderWidth: 1,
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
});
