import React, { useContext } from 'react'
import { Button, Text, View } from 'react-native'
import { AuthContext, AuthContextType } from '../store/auth-context';

const ProfileScreen = () => {
  const authCtx = useContext<AuthContextType>(AuthContext); 
  return (
    <View>
      <Button
        onPress={() => authCtx.logout()}
        title="Logout"
        color="red"
        accessibilityLabel="Learn more about this purple button"
      />
    </View>)
}

export default ProfileScreen
