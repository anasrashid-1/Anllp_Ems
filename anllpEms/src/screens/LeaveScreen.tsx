import React, { useCallback, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import COLORS from '../constants/colors';
import { AuthContext, AuthContextType } from './../store/auth-context';
import { Dialog, Portal, Button, ActivityIndicator } from "react-native-paper";
import { useFocusEffect } from '@react-navigation/native';
import RequestList from '../components/LeaveRequestScreen/RequestList';

// Define types for the leave data and balance
interface LeaveData {
  LeaveId: number;
  totalLeaves: number | null;
  usedLeaves: number | null;
  remainingLeaves: number | null;
}



const LeavesScreen: React.FC = () => {
  const useCtx = useContext<AuthContextType>(AuthContext);
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [dialogIcon, setDialogIcon] = useState<string>("");
  const [dialogMessage, setDialogMessage] = useState<string>("");
  const [leaveData, setLeaveData] = useState<LeaveData[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveData | null>(null);

  const showDialog = (message: string, icon: string) => {
    setDialogMessage(message);
    setDialogVisible(true);
    setDialogIcon(icon);
  };

  useFocusEffect(
    useCallback(() => {
      const fetchLeaveData = async () => {
        try {
          setLoading(true); // Start loading
          const response = await fetch(`${useCtx.apiUrl}/leaves/${useCtx.userId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${useCtx.token}`,
              'Content-Type': 'application/json',
            },
          });
          const result = await response.json();

          if (response.ok) {
            const data: LeaveData[] = result.data;

            if (data.length > 0) {
              setLeaveBalance(data[0]);
              setLeaveData(data);
            }
          } else {
            console.error('Failed to fetch leave data', result.message);
            showDialog(result.message, "alert");
          }
        } catch (error: any) {
          console.error('Error fetching leave data:', error);
          showDialog(error.message, "alert");
        } finally {
          setLoading(false); // Stop loading
        }
      };

      fetchLeaveData();
    }, [useCtx.userId, useCtx.token]) // Add dependencies
  );

  return (
    <View style={styles.screenContainer}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size={'large'} color={'gray'} />
        </View>
      ) : (
        <>
          <View style={styles.cardsContainer}>
            <View style={styles.card}>
              <Text style={styles.cardValueText}>
                {leaveBalance && leaveBalance.totalLeaves!== null ? leaveBalance.totalLeaves : 'N/A'}
              </Text>
              <Text style={styles.cardDescText}>Total</Text>
              <Text style={styles.cardExtraText}>All allocated leaves</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardValueText}>
                {leaveBalance && leaveBalance.usedLeaves !== null ? leaveBalance.usedLeaves : 'N/A'}
              </Text>
              <Text style={styles.cardDescText}>Used</Text>
              <Text style={styles.cardExtraText}>Leaves already taken</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardValueText}>
                {leaveBalance && leaveBalance.remainingLeaves !== null ? leaveBalance.remainingLeaves : 'N/A'}
              </Text>
              <Text style={styles.cardDescText}>Left</Text>
              <Text style={styles.cardExtraText}>Leaves remaining now</Text>
            </View>
          </View>

          {leaveData.length > 0 && leaveData[0].LeaveId !== null ? (
            <RequestList leaveData={leaveData} />
          ) : (
            <View style={styles.requestListcontainer}>
              <Text style={styles.requestListHeaderText}>No leave requests found. ✨ Please add your leave request! 📝</Text>
            </View>
          )}
        </>
      )}

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Icon
            icon={dialogIcon}
            color={dialogIcon === "check-circle" ? "green" : dialogIcon === "alert" ? "red" : "gray"}
            size={40}
          />
          <Dialog.Content style={{ marginTop: 30 }}>
            <Text>{dialogMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} labelStyle={{ color: COLORS.ACCENT_ORANGE }}>OK</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default LeavesScreen;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: 'center',
  },
  screenContainer: {
    backgroundColor: 'white',
    flex: 1,
    padding: 12,
    paddingBottom: 0,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  skeletonCard: {
    width: '31%',
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    marginBottom: 10,
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
    color: "gray",
  },
  cardDescText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.ACCENT_ORANGE,
    marginTop: 16,
  },
  cardExtraText: {
    fontSize: 10,
    color: "gray",
  },
  requestListcontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestListHeaderText: {
    fontSize: 14,
    color: "gray",
  }
});
