import React, { useContext, useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { Button, Divider, ActivityIndicator } from 'react-native-paper';
import { UserCircleIcon } from 'react-native-heroicons/solid';
import { Dropdown } from "react-native-element-dropdown";
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';
import DialogComp from '../components/DialogComp';

interface LeaveRequest {
  LeaveId: number;
  LeaveType: string;
  Reason: string;
  StartDate: string;
  EndDate: string;
  RequestedAt: string;
  ApprovedAt: string;
  RejectedAt: string;
  Status: string;
  userName: string;
  UserId: number;
  usedLeaves: number;
  totalLeaves: number;
  remainingLeaves: number;
}

interface DialogState {
  dialogVisible: boolean;
  dialogIcon: string;
  dialogMessage: string;
}

const LeaveRequests: React.FC = () => {
  const useCtx = useContext(AuthContext);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredLeaveRequests, setFilteredLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  
  const [dialogState, setDialogState] = useState<DialogState>({
    dialogVisible: false,
    dialogIcon: "",
    dialogMessage: "",
  });


  const [uniqueuserNames, setUniqueUserNames] = useState<LeaveRequest[]>([]);
  const [selectedUniqueUserName, setSelectedUniqueUserName] = useState<string>("");

  const filterRequestList = (userName: string) => {
    const filteredRequests = leaveRequests.filter(item => item.userName === userName);
    setFilteredLeaveRequests(filteredRequests);
  };

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${useCtx.apiUrl}/leaves`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${useCtx.token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        const data = result.data;
        if (data.length > 0) {
          setLeaveRequests(data);
          setFilteredLeaveRequests(data);
          const uniqueUserNames = data.reduce((acc: LeaveRequest[], current: LeaveRequest) => {
            if (current.userName && !acc.some(item => item.userName === current.userName)) {
              acc.push(current);
            }
            return acc;
          }, []);
          setUniqueUserNames(uniqueUserNames);
        }
      } else {
        showDialog('Failed to fetch leave requests', 'alert');
      }
    } catch (error: any) {
      showDialog(error.message, 'alert');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: LeaveRequest }) => {
    const startDate = new Date(item.StartDate);
    const endDate = new Date(item.EndDate);
    const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const formattedDateRange = `${startDate.getDate()} ${startDate.toLocaleString('en-US', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleString('en-US', { month: 'short' })}`;
    const requestedAt = new Date(item.RequestedAt);
    const requestedDay = `${requestedAt.getDay()} ${requestedAt.toLocaleString('en-US', { month: 'short' })}`;

    const ApprovedAt = new Date(item.ApprovedAt);
    const RejectedAt = new Date(item.RejectedAt);
    const formattedStatusSate = item.Status === 'Approved'
    ? `${ApprovedAt.getDate()} ${ApprovedAt.toLocaleString('en-US', { month: 'short' })}`
    : `${RejectedAt.getDate()} ${RejectedAt.toLocaleString('en-US', { month: 'short' })}`;
  
  
    const handleAction = async (LeaveId: number, applicantUserId: number, action: string) => {
      try {
        const response = await fetch(`${useCtx.apiUrl}/leaves/update/${action}/${LeaveId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${useCtx.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ applicantUserId }),
        });

        if (response.ok) {
          showDialog(`Request ${action === 'Approved' ? 'approved' : 'rejected'} successfully!`, 'check-circle');
          fetchLeaveRequests();
        } else {
          showDialog('Failed to update the request', 'alert');
        }
      } catch (error: any) {
        showDialog(error.message, 'alert');
      }
    };

    const statusStyles: { [key: string]: { backgroundColor: string; color: string } } = {
      Pending: { backgroundColor: 'orange', color: 'white' },
      Approved: { backgroundColor: 'green', color: 'white' },
      Rejected: { backgroundColor: 'red', color: 'white' },
    };

    return (
      <View style={styles.card}>
        {/* Row 1 */}
        <Text style={styles.sectionTitle}>{item.LeaveType}</Text>
        <Text style={styles.sectionText}>{item.Reason}</Text>
        <Text style={styles.sectionText}>{daysRequested} Days ● {formattedDateRange}</Text>
        <Text style={[styles.sectionText, { marginTop: 6 }]}>Requested on : {requestedDay}</Text>
        <Divider style={styles.divider} />

        {/* Row 2 */}
        <View style={styles.row}>
          <View style={styles.employeeDetailsContainer}>
            <View>
              <UserCircleIcon size={40} color='grey' />
            </View>
            <View>
              <Text style={styles.sectionText}>{item.userName}</Text>
              <Text style={styles.sectionText}>Employee Id: {item.UserId}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.sectionTitle2}>Days Left</Text>
            <Text style={styles.sectionText}>
              {item.usedLeaves}/{item.totalLeaves}
            </Text>
          </View>
        </View>
        <Divider style={styles.divider} />

        {/* Row 3 */}
        {item.Status === 'Pending' ? (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => handleAction(item.LeaveId, item.UserId, 'Approved')}
              style={[styles.actionButton, styles.approveButton]}
            >
              Approve
            </Button>
            <Button
              mode="contained"
              onPress={() => handleAction(item.LeaveId, item.UserId, 'Rejected')}
              style={[styles.actionButton, styles.rejectButton]}
            >
              Reject
            </Button>
          </View>
        ) : (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyles[item.Status]?.backgroundColor || 'gray' },
            ]}
          >
            <Text style={{ color: statusStyles[item.Status]?.color || 'black', fontWeight: 'bold' }}>
              {item.Status} on {formattedStatusSate}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const showDialog = (message: string, icon: string) => {
    setDialogState({
      dialogMessage: message,
      dialogVisible: true,
      dialogIcon: icon,
    });
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  return (
    <View style={styles.screenContainer}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" color={COLORS.DARK_GRAY} />
        </View>
      ) : filteredLeaveRequests.length > 0 && filteredLeaveRequests[0].LeaveId !== null ? (
        <View>
          <View style={styles.dropdownContainer}>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={uniqueuserNames}
              search={true}
              searchPlaceholder="Enter username to search"
              searchField="userName"
              labelField="userName"
              valueField="userName"
              placeholder="Filter"
              value={selectedUniqueUserName}
              onChange={(item) => {
                setSelectedUniqueUserName(item.userName);
                filterRequestList(item.userName);
              }}
            />
          </View>

          <View style={styles.cardsContainer}>
            <FlatList
              data={filteredLeaveRequests}
              keyExtractor={(item) => item.LeaveId.toString()}
              renderItem={renderItem}
              contentContainerStyle={styles.listContainer}
            />
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No leave requests found. ✨</Text>
        </View>
      )}

      
       {/* for dialog */}
       <DialogComp dialogState={dialogState} setDialogState={setDialogState}/>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    backgroundColor: 'white',
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 2,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.5,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  employeeDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: COLORS.ACCENT_ORANGE,
  },
  sectionTitle2: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.ACCENT_ORANGE,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'gray',
  },
  divider: {
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: 'green',
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: 'red',
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
  },
  listContainer: {
    paddingBottom: 16,
  },


  // for dropdown
  dropdownContainer: {

    paddingVertical: 10
  },
  dropdown: {
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    //   borderWidth: 1 / 6,

  },
  selectedTextStyle: {
    color: 'gray',
    fontWeight: 300,
  },
  placeholderStyle: {
    color: 'gray',
    fontWeight: 300,
  },
  cardsContainer: {
    height: '90%',
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },

  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
  }

});

export default LeaveRequests;
