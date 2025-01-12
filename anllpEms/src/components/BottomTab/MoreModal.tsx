import React, { useContext } from 'react';
import { Modal, View, Pressable, StyleSheet, Text } from 'react-native';
import COLORS from '../../constants/colors';
import Tab from './MoreOptionTab/Tab';
import { AuthContext } from '../../store/auth-context';
import rbac from '../../util/roleBaseAccess';

interface MoreModalProps {
  isModalVisible: boolean;
  toggleModal: () => void;
}

const MoreModal: React.FC<MoreModalProps> = ({ isModalVisible, toggleModal }) => {
  const { userId } = useContext(AuthContext)
  return (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={toggleModal}

    >
      <Pressable style={styles.backdrop} onPress={toggleModal}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>More Options</Text>

          {/* Grid of options */}
          <View style={styles.gridContainer}>
            {/* Row 1 */}
            <View style={styles.row}>
              <Tab icon="UserGroupIcon" name="Daily Expenses" route="Daily Expenses" toggleModal={toggleModal} />
              {rbac(userId) && <Tab icon="UserGroupIcon" name="Expenses Admin" route="Daily Expense Admin" toggleModal={toggleModal} />}
              <Tab icon="ChartBarIcon" name="Sales Lead" route="Sales Lead" toggleModal={toggleModal} />
              <Tab icon="ChartBarIcon" name="Growerdetails" route="Growerdetails" toggleModal={toggleModal} />
              {rbac(userId) && <Tab icon="ClipboardDocumentListIcon" name="Leave Requests" route="Leave Requests" toggleModal={toggleModal} />}
              {rbac(userId) && <Tab icon="ClipboardDocumentListIcon" name="Attendance Admin" route="Attendance Admin" toggleModal={toggleModal} />}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.LIGHT_GRAY,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: "wrap"
  },
});

export default MoreModal;