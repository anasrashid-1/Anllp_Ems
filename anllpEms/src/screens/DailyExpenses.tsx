import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ListItem from '../components/DailyExpense/ListItem';
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
}

interface DialogState {
  dialogVisible: boolean;
  dialogIcon: string;
  dialogMessage: string;
}

const DailyExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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

          if (response.ok) {
            const data: Expense[] = result.data;

            if (data.length > 0) {
              setExpenses(data);
            }
          } else {
            console.error('Failed to fetch leave data', result.message);
            showDialog(result.message, 'alert');
          }
        } catch (error: any) {
          console.error('Error fetching leave data:', error);
          showDialog(error.message, 'alert');
        } finally {
          setLoading(false); // Stop loading
        }
      };

      fetchExpenses();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authCtx.userId, authCtx.token])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.expenseID.toString()}
          renderItem={({ item }) => <ListItem item={item} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No expenses found. Start adding some!</Text>
          }
        />
      )}
      <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
    </View>
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
  emptyText: {
    textAlign: 'center',
    color: COLORS.DARK_GRAY,
    marginTop: 50,
    fontSize: 16,
  },
});
