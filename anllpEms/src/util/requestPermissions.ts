import { Alert, PermissionsAndroid, Platform } from "react-native";

const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const fineLocationGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Tracking App',
        message: 'This app requires location access to track your movement.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    if (fineLocationGranted !== 'granted') {
      Alert.alert('Permission Denied', 'Fine location permission is required.');
      return false;
    }

    const backgroundLocationGranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Location Tracking App',
        message:
          'This app requires background location access to track your movement.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );

    if (backgroundLocationGranted !== 'granted') {
      Alert.alert('Permission Denied', 'Background location permission is required.');
      return false;
    }

    if (Platform.Version >= 31) {
      const notificationPermissionGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'This app needs notification permission to send alerts.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );

      if (notificationPermissionGranted !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permission is required.');
        return false;
      }
    }
    return true;
  }
  return false;
};



export default requestPermissions