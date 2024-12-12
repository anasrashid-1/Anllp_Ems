import React, { useState } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { Dropdown } from "react-native-element-dropdown";


interface LeaveRequest {
  LeaveId: number;
  LeaveType: string;
  StartDate: string;
  EndDate: string;
  RequestedAt: string;
  Status: string;
}

interface RequestListProps {
  leaveData: any;
}



const renderItem = ({ item }: { item: LeaveRequest }) => {
  const statusStyles: { [key: string]: { backgroundColor: string; color: string } } = {
    Pending: { backgroundColor: 'orange', color: 'white' },
    Approved: { backgroundColor: 'green', color: 'white' },
    Rejected: { backgroundColor: 'red', color: 'white' },
  };

  const startDate = new Date(item.StartDate);
  const endDate = new Date(item.EndDate);
  const daysRequested = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const requestedAt = new Date(item.RequestedAt);
  const requestedDay = requestedAt.getUTCDate();

  return (
    <View style={styles.requestListRow}>
      <View>
        <View style={styles.reqAtContainer}>
          <Text style={styles.reqAtText}>Requested on</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{requestedDay}</Text>
          <Text style={styles.monthText}>
            {startDate.toLocaleString('default', { month: 'short' })}
          </Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <Text style={styles.requestListRowText}>Leave Type: {item.LeaveType}</Text>
        <Text style={styles.requestListRowText}>From: {startDate.toDateString()}</Text>
        <Text style={styles.requestListRowText}>To: {endDate.toDateString()}</Text>
        <Text style={styles.requestListRowText}>Days Requested: {daysRequested} days</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusStyles[item.Status]?.backgroundColor || 'gray' },
          ]}
        >
          <Text style={{ color: statusStyles[item.Status]?.color || 'black', fontWeight: 'bold' }}>
            {item.Status}
          </Text>
        </View>
      </View>
    </View>
  );
};

const RequestList = ({ leaveData }: RequestListProps) => {
  const [requests, setRequests] = useState<LeaveRequest[]>(leaveData);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>(leaveData);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const data = [
    { label: "Pending", value: "Pending" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "All", value: "All" },
  ];

  const filterRequestList = (status: string | null) => {
    if (status === "All" || status === null) {
      setFilteredRequests(leaveData); // Show all requests if 'All' is selected
    } else {
      setFilteredRequests(requests.filter((request) => request.Status === status)); // Filter by selected status
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.requestListHeaderContainer}>
        <Text style={styles.requestListHeaderText}>Leave Requests</Text>

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
              filterRequestList(item.value);
            }}
          />
        </View>
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.LeaveId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.requestListContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  requestListHeaderContainer: {
    marginTop: 15,
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
  requestListContainer: {
    marginTop: 15,
  },
  requestListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 2,
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    elevation: 5,
  },
  reqAtContainer: {
    width: 70,
    height: 30,
    borderTopRightRadius: 8,
    borderTopLeftRadius: 8,
    backgroundColor: 'gray',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reqAtText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  dateContainer: {
    width: 70,
    height: 90,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'lightgray',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'gray',
  },
  monthText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'gray',
  },
  requestDetails: {
    flex: 1,
  },
  requestListRowText: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
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
});

export default RequestList;
