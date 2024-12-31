import React, { useContext, useState, useEffect } from 'react';
import { Alert, Button, Image, Modal, StyleSheet, Text, View } from 'react-native';
import COLORS from '../constants/colors';
import { AuthContext, AuthContextType } from '../store/auth-context';
import DialogComp from '../components/DialogComp';
import Input from '../components/LoginScreen/Input';

interface DialogState {
  dialogVisible: boolean;
  dialogIcon: string;
  dialogMessage: string;
}

const ProfileScreen = () => {
  const authCtx = useContext<AuthContextType>(AuthContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOldPasswordVisible, setOldPasswordVisible] = useState<boolean>(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState<boolean>(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState<boolean>(false);
  const [error, setError] = useState('');

  // Profile state
  const [name, setName] = useState<string>(authCtx.userName || 'N/A');
  const [userId, setUserId] = useState<string>(authCtx.userId || 'N/A');
  const [userRole, setUserRole] = useState<string>(authCtx.userRole || 'N/A');

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

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${authCtx.apiUrl}/changepassword`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authCtx.token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();
      setIsModalVisible(false);
      if (data.success) {
        Alert.alert('Success', 'Your password has been changed successfully.');
        setNewPassword('');
        setConfirmPassword('');
        setOldPassword('');
      } else {
        showDialog(data.message, 'alert');
      }
    } catch (error) {
      showDialog(error.message, 'alert');
    }
  };

  // If authCtx updates, update profile state
  useEffect(() => {
    setName(authCtx.userName || 'N/A');
    setUserId(authCtx.userId || 'N/A');
    setUserRole(authCtx.userRole || 'N/A');
  }, [authCtx]);

  return (
    <View style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Profile Image */}
        <Image
          source={{ uri: authCtx.profilePicture || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png' }}
          style={styles.profileImage}
        />

        {/* Profile Information */}
        <View style={styles.profileInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{name}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{userId}</Text>
          </View>

          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{userRole}</Text>
          </View>
        </View>
      </View>

      {/* Buttons Section */}
      <View style={styles.buttonContainer}>
        <Button
          onPress={() => setIsModalVisible(true)}
          title="Change Password"
          color={COLORS.ACCENT_ORANGE}
        />
        <Button
          onPress={() => authCtx.logout()}
          title="Logout"
          color={COLORS.PRIMARY_RED}
          accessibilityLabel="Logout from the app"
        />
      </View>

      {/* Change Password Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Password</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Old Password */}
            <Input
              label="Old Password"
              keyboardType="default"
              value={oldPassword}
              secureTextEntry={!isOldPasswordVisible}
              onUpdateValue={setOldPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setOldPasswordVisible(!isOldPasswordVisible)}
              isPasswordVisible={isOldPasswordVisible}
            />

            {/* New Password */}
            <Input
              label="New Password"
              keyboardType="default"
              value={newPassword}
              secureTextEntry={!isNewPasswordVisible}
              onUpdateValue={setNewPassword}
              showPasswordToggle={true}
              onTogglePassword={() => setNewPasswordVisible(!isNewPasswordVisible)}
              isPasswordVisible={isNewPasswordVisible}
            />

            {/* Confirm New Password */}
            <Input
              label="Confirm New Password"
              keyboardType="default"
              value={confirmPassword}
              secureTextEntry={!isConfirmPasswordVisible}
              showPasswordToggle={true}
              onUpdateValue={setConfirmPassword}
              onTogglePassword={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
              isPasswordVisible={isConfirmPasswordVisible}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                color={COLORS.DARK_GRAY}
                onPress={() => setIsModalVisible(false)}
              />
              <Button
                title="Change"
                color={COLORS.ACCENT_ORANGE}
                onPress={handleChangePassword}
              />
            </View>
          </View>
        </View>
      </Modal>

      <DialogComp dialogState={dialogState} setDialogState={setDialogState} />
    </View>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexDirection: 'row', // Align image and text side by side
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: COLORS.ACCENT_ORANGE,
    marginRight: 20,
    elevation: 5,
  },
  profileInfo: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.DARK_GRAY,
    fontWeight: '500',
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.DARK_GRAY,
    fontWeight: '400',
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: 20,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    width: '85%',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.DARK_GRAY,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  errorText: {
    color: COLORS.PRIMARY_RED,
    fontSize: 14,
    marginBottom: 10,
  },
});

export default ProfileScreen;
