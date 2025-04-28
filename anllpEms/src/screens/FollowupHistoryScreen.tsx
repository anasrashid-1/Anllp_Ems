import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import COLORS from '../constants/colors';
import {AuthContext} from '../store/auth-context';
import {PlusIcon} from 'react-native-heroicons/solid';

const FollowupHistoryScreen = ({route, navigation}) => {
  const {salesLead} = route.params;
  const authCtx = useContext(AuthContext);
  const [followups, setFollowups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        const response = await fetch(
          `${authCtx.apiUrl}/followups/lead/${salesLead.id}`,
          {
            headers: {
              Authorization: `Bearer ${authCtx.token}`,
            },
          },
        );
        const data = await response.json();
        setFollowups(data);
      } catch (error) {
        console.error('Error fetching followups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowups();
  }, [salesLead.id]);

  const renderFollowupItem = ({item}) => (
    <View style={styles.followupCard}>
      <View style={styles.followupHeader}>
        <Text style={styles.followupDate}>
          {new Date(item.dateOfFollowup).toLocaleDateString()}
        </Text>
        <Text style={styles.followupType}>{item.followupType}</Text>
      </View>
      <Text style={styles.followupSummary}>{item.discussionSummary}</Text>
      <View style={styles.followupFooter}>
        <Text style={styles.interestLevel}>Interest: {item.interestLevel}</Text>
        <Text style={styles.nextDate}>
          Next: {new Date(item.nextFollowupDate).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Follow-up History</Text>
        <Text style={styles.subtitle}>{salesLead.firmname}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
      ) : followups.length > 0 ? (
        <FlatList
          data={followups}
          renderItem={renderFollowupItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text style={styles.emptyText}>No follow-ups recorded yet</Text>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Add Followup', {salesLead})}>
        <View style={styles.buttonContent}>
          <PlusIcon size={18} color="white" />
          <Text style={styles.addButtonText}>Add New Follow-up</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

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
  },
  interestLevel: {
    fontSize: 13,
    color: COLORS.ACCENT_ORANGE,
  },
  nextDate: {
    fontSize: 13,
    color: COLORS.PRIMARY_GREEN,
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
});

export default FollowupHistoryScreen;
