import React, {useState, useContext, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import COLORS from '../constants/colors';
import {AuthContext} from '../store/auth-context';
import {StackScreenProps} from '@react-navigation/stack';
import {useFocusEffect} from '@react-navigation/native';

type SalesLead = {
  wid: string;
  firmname: string;
};

type FollowUp = {
  followUpId: string | number;
  dateOfFollowUp: string;
  followUpType: string;
  discussionSummary: string;
  customerInterestLevel: string;
  nextFollowUpDate: string;
  createdAt: string;
};

type RootStackParamList = {
  FollowupHistory: {salesLead: SalesLead};
  'Add Followup': {salesLead: SalesLead};
};

type Props = StackScreenProps<RootStackParamList, 'FollowupHistory'>;

const FollowupHistoryScreen: React.FC<Props> = ({route}) => {
  const {salesLead} = route.params;
  const authCtx = useContext(AuthContext);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Changed initial state to false
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;
  const flatListRef = useRef<FlatList>(null);

  const fetchFollowups = useCallback(
    async (currentPage = 1, isRefreshing = false) => {
      try {
        if (isRefreshing) {
          setIsRefreshing(true);
          currentPage = 1;
        } else if (currentPage === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
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
        setIsLoadingMore(false);
      }
    },
    [authCtx.apiUrl, authCtx.token, salesLead.wid],
  );

  useFocusEffect(
    useCallback(() => {
      fetchFollowups();
    }, [fetchFollowups]),
  );

  const handleLoadMore = useCallback(() => {
    if (page < totalPages && !isLoadingMore) {
      fetchFollowups(page + 1);
    }
  }, [page, totalPages, isLoadingMore, fetchFollowups]);

  const handleRefresh = useCallback(() => {
    fetchFollowups(1, true);
  }, [fetchFollowups]);

  // Optimized renderItem with React.memo
  const renderFollowupItem = useCallback(
    ({item}: {item: FollowUp}) => (
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
    ),
    [],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={COLORS.ACCENT_ORANGE} />
      </View>
    );
  }, [isLoadingMore]);

  const keyExtractor = useCallback(
    (item: FollowUp) => item.followUpId.toString(),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Follow-up History for {`${salesLead.firmname}`}
        </Text>
        {/* <Text style={styles.subtitle}>{salesLead.firmname}</Text> */}
        <Text style={styles.countText}>
          Showing {followups.length} of {totalCount} follow-ups
        </Text>
      </View>

      {isLoading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
        </View>
      ) : followups.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={followups}
          renderItem={renderFollowupItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2} // More sensitive threshold for smoother loading
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.ACCENT_ORANGE]}
              tintColor={COLORS.ACCENT_ORANGE}
            />
          }
          initialNumToRender={10} // Render initial 10 items
          maxToRenderPerBatch={5} // Render 5 new items at a time
          updateCellsBatchingPeriod={50} // Batch updates every 50ms
          windowSize={21} // Render 1 screen above + 20 below = 21 total
          removeClippedSubviews={true} // Improve performance by unmounting offscreen views
        />
      ) : (
        <Text style={styles.emptyText}>No follow-ups recorded yet</Text>
      )}
    </View>
  );
};

export default React.memo(FollowupHistoryScreen);

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
    paddingBottom: 20,
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
  footer: {
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
