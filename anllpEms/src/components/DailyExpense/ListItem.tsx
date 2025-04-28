import {
  StyleSheet,
  Text,
  View,
  Image,
  Modal,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import COLORS from '../../constants/colors';

interface ListItemProps {
  item: {
    expenseID: number;
    amount: number;
    expenseCategory: string;
    expenseDate: string;
    expenseDescription: string;
    image: string;
    status: string; // Adding status to the item
  };
}

export default function ListItem({item}: ListItemProps) {
  const [isModalVisible, setModalVisible] = useState(false);
  console.log({uri: item.image});

  const toggleModal = () => setModalVisible(!isModalVisible);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return COLORS.ACCENT_ORANGE;
      case 'Approved':
        return COLORS.LIGHT_GREEN;
      case 'Rejected':
        return COLORS.PRIMARY_RED;
      default:
        return COLORS.DARK_GRAY;
    }
  };

  return (
    <>
      <View style={styles.cardContainer}>
        <View style={styles.expenseItem}>
          <TouchableOpacity onPress={toggleModal}>
            <Image source={{uri: item.image}} style={styles.expenseImage} />
          </TouchableOpacity>
          <View style={styles.expenseDetails}>
            <Text style={styles.expenseCategory}>{item.expenseCategory}</Text>
            <Text style={styles.expenseDate}>
              Date: {new Date(item.expenseDate).toLocaleDateString()}
            </Text>
            <Text style={styles.expenseAmount}>Amount: ₹{item.amount}</Text>
            <Text
              style={[
                styles.expenseStatus,
                {color: getStatusColor(item.status)},
              ]}>
              Status: {item.status}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.expenseDescription, {color: COLORS.ACCENT_ORANGE}]}>
          Description
        </Text>
        <Text style={styles.expenseDescription}>{item.expenseDescription}</Text>
      </View>

      {/* Modal for Image Preview */}
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Image
              source={{uri: item.image}}
              style={styles.modalImage}
              onError={() => console.log('Failed to load image')}
            />
            <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
    backgroundColor: COLORS.WHITE,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    resizeMode: 'cover',
  },
  expenseDetails: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.DARK_GRAY,
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.ACCENT_ORANGE,
  },
  expenseStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  expenseDescription: {
    fontSize: 14,
    color: COLORS.DARK_GRAY,
    marginTop: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '70%', // Reduced from 90%
    maxWidth: 350,
    backgroundColor: COLORS.WHITE,
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
    resizeMode: 'contain',
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  closeButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
