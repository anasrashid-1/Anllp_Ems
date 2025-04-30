import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  // TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import COLORS from '../constants/colors';
import {AuthContext} from '../store/auth-context';
// import {PlusIcon} from 'react-native-heroicons/solid';
import {StackScreenProps} from '@react-navigation/stack';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


// Define the sales lead type
type SalesLead = {
  wid: string;
  firmname: string;
};

// Define the follow-up item type
type FollowUp = {
  followUpId: string | number;
  dateOfFollowUp: string;
  followUpType: string;
  discussionSummary: string;
  customerInterestLevel: string;
  nextFollowUpDate: string;
  createdAt: string;
};

// Define navigation params
type RootStackParamList = {
  FollowupHistory: {salesLead: SalesLead};
  'Add Followup': {salesLead: SalesLead};
};

// Define component props
type Props = StackScreenProps<RootStackParamList, 'FollowupHistory'>;

const FollowupHistoryScreen: React.FC<Props> = ({route}) => {
  const {salesLead} = route.params;
  const authCtx = useContext(AuthContext);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  const fetchFollowups = async (currentPage = 1, isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setIsRefreshing(true);
        currentPage = 1;
      } else {
        setIsLoading(true);
      }

      const response = await fetch(
        `${authCtx.apiUrl}/saleslead/followup/get?salesLeadId=${salesLead.wid}&page=${currentPage}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${authCtx.token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch follow-ups');
      }

      if (isRefreshing || currentPage === 1) {
        setFollowups(data.data);
      } else {
        setFollowups(prev => [...prev, ...data.data]);
      }

      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.totalCount);
      setPage(currentPage);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchFollowups(); // Re-fetch when the screen is focused
    }, [])
  );

  useEffect(() => {
    fetchFollowups();
  }, []);

  const handleLoadMore = () => {
    if (page < totalPages && !isLoading) {
      fetchFollowups(page + 1);
    }
  };

  const handleRefresh = () => {
    fetchFollowups(1, true);
  };

  const renderFollowupItem = ({item}: {item: FollowUp}) => (
    <View style={styles.followupCard}>
      <View style={styles.followupHeader}>
        <Text style={styles.followupDate}>
          {new Date(item.dateOfFollowUp).toLocaleDateString()}
        </Text>
        <Text style={styles.followupType}>{item.followUpType}</Text>
      </View>
      <Text style={styles.followupSummary}>{item.discussionSummary}</Text>
      <View style={styles.followupFooter}>
        <Text style={styles.interestLevel}>
          Interest: {item.customerInterestLevel}
        </Text>
        <Text style={styles.nextDate}>
          Next: {new Date(item.nextFollowUpDate).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.createdAt}>
        Created: {new Date(item.createdAt).toLocaleString()}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading || page === 1) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Follow-up History</Text>
        <Text style={styles.subtitle}>{salesLead.firmname}</Text>
        <Text style={styles.countText}>
          Showing {followups.length} of {totalCount} follow-ups
        </Text>
      </View>

      {isLoading && page === 1 ? (
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      ) : followups.length > 0 ? (
        <FlatList
          data={followups}
          renderItem={renderFollowupItem}
          keyExtractor={item => item.followUpId.toString()}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.ACCENT_ORANGE]}
            />
          }
        />
      ) : (
        <Text style={styles.emptyText}>No follow-ups recorded yet</Text>
      )}

      {/* <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Add Followup', {salesLead})}>
        <View style={styles.buttonContent}>
          <PlusIcon size={18} color="white" />
          <Text style={styles.addButtonText}>Add New Follow-up</Text>
        </View>
      </TouchableOpacity> */}
    </View>
  );
};

export default FollowupHistoryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 15,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.DARK_GRAY,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.DARK_GRAY,
    marginTop: 5,
  },
  countText: {
    fontSize: 14,
    color: COLORS.DARK_GRAY,
    marginTop: 5,
  },
  listContainer: {
    paddingBottom: 80,
  },
  followupCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  followupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  followupDate: {
    fontSize: 14,
    color: COLORS.DARK_GRAY,
    fontWeight: 'bold',
  },
  followupType: {
    fontSize: 14,
    color: COLORS.ACCENT_ORANGE,
    fontWeight: 'bold',
  },
  followupSummary: {
    fontSize: 14,
    color: COLORS.DARK_GRAY,
    marginBottom: 10,
  },
  followupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  interestLevel: {
    fontSize: 13,
    color: COLORS.ACCENT_ORANGE,
  },
  nextDate: {
    fontSize: 13,
    color: COLORS.PRIMARY_GREEN,
  },
  createdAt: {
    fontSize: 12,
    color: COLORS.MEDIUM_GRAY,
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: COLORS.DARK_GRAY,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    paddingVertical: 20,
  },
});
