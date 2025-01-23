/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import notifee, {AndroidImportance} from '@notifee/react-native';
import Geolocation, {
  GeolocationError,
  GeolocationResponse,
} from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import {useIsFocused} from '@react-navigation/native';
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BackgroundService, {
  BackgroundTaskOptions,
} from 'react-native-background-actions';
import MapPreview from '../components/HomeScreen/MapPreview';
import MarkAttendance from '../components/HomeScreen/MarkAttendance';
import {AuthContext} from '../store/auth-context';
import requestPermissions from '../util/requestPermissions';
import {ActivityIndicator} from 'react-native-paper';
import COLORS from '../constants/colors';

export interface AttendanceStatus {
  attendanceId: string;
  status: 'Active' | 'Inactive';
  onLeave?: boolean;
  checkOutTime?: string;
  checkInTime?: string;
  sessionDuration?: number;
}

const Home: React.FC = () => {
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus | null>(null);
  const {apiUrl, token, userId} = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(false);
  const [locLoading, setLocLading] = useState<boolean>(false);
  const [location, setLocation] = useState({latitude: 0, longitude: 0});

  const isFocused = useIsFocused();

  const requestPermissionAndFetchLocation = async () => {
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to start tracking.',
        );
        return;
      }
      // Platform-specific permission handling
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Permission Denied',
            'Location permission is required to start tracking.',
          );
          return null;
        }
      }
      setLocLading(true);

      // Set a timeout to prevent indefinite waiting
      return new Promise((resolve, reject) => {
        const locationTimeout = setTimeout(() => {
          reject(new Error('Location fetch timed out'));
        }, 10000); // 10 seconds timeout

        Geolocation.getCurrentPosition(
          position => {
            setLocLading(false);
            clearTimeout(locationTimeout);
            const {latitude, longitude} = position.coords;
            setLocation({latitude, longitude});
            resolve({latitude, longitude});
          },
          error => {
            setLocLading(false);
            clearTimeout(locationTimeout);
            console.error('Location Error:', error);

            // More detailed error handling
            switch (error.code) {
              case error.PERMISSION_DENIED:
                console.log('Error', 'Location permission was denied');
                break;
              case error.POSITION_UNAVAILABLE:
                console.log('Error', 'Location information is unavailable');
                break;
              case error.TIMEOUT:
                console.log('Error', 'Location request timed out');
                break;
              default:
                console.log(
                  'Error',
                  'An unknown error occurred while fetching location',
                );
            }

            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000,
            distanceFilter: 10,
          },
        );
      });
    } catch (error) {
      console.error('Location Fetch Error:', error);
      Alert.alert('Error', 'Failed to fetch location');
      return null;
    }
  };
  useEffect(() => {
    requestPermissionAndFetchLocation();
    fetchAttendanceStatus();
  }, [isFocused]);

  const displayNotification = async (title: string, body: string) => {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
    });

    // Display the notification
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  };

  const handleForegroundNotifications = () => {
    messaging().onMessage(async remoteMessage => {
      const title = remoteMessage.notification?.title || 'New Notification';
      const body = remoteMessage.notification?.body || 'You have a new message';

      await displayNotification(title, body);
    });
  };

  // Post coordinates to the server
  const logLocation = async (
    latitude: number,
    longitude: number,
  ): Promise<void> => {
    if (!attendanceStatus?.attendanceId) {
      console.warn('Attendance ID is not available.');
      return;
    }

    try {
      const payload = {
        attendanceId: attendanceStatus.attendanceId,
        lat: latitude,
        long: longitude,
      };

      const response = await fetch(`${apiUrl}/attendance/locationlog`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', `Failed to log attendance: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Attendance Logging Error:', error);
      Alert.alert(
        'Error',
        'Failed to connect to the server. Please try again later.',
      );
    }
  };

  // Sleep function for delays in background task
  const sleep = (time: number): Promise<void> =>
    new Promise(resolve => setTimeout(resolve, time));

  // The background task that runs in a loop
  const trackLocationInBackground = async (taskDataArguments?: {
    delay: number;
  }): Promise<void> => {
    const delay = taskDataArguments?.delay || 1800000;

    await BackgroundService.updateNotification({
      taskTitle: 'Location Tracking',
      taskDesc: 'Tracking your location in the background.',
      color: '#ff00ff',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
    });

    while (BackgroundService.isRunning()) {
      Geolocation.getCurrentPosition(
        async (position: GeolocationResponse) => {
          const {latitude, longitude} = position.coords;
          await logLocation(latitude, longitude);
        },
        (error: GeolocationError) => {
          console.error('Geolocation Error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
          distanceFilter: 10,
        },
      );

      await sleep(delay);
    }
  };

  // Options for the background task
  const backgroundTaskOptions: BackgroundTaskOptions = {
    taskName: 'LocationTracking',
    taskTitle: 'Location Tracking in Progress',
    taskDesc: 'Tracking your location in the background.',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'com.anllpems://chat/jane',
    parameters: {
      delay: 1800000,
    },
    foreground: true,
    notification: {
      openAppOnTap: true,
    },
  };

  // Fetch attendance status
  const fetchAttendanceStatus = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/attendance/status/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setAttendanceStatus(data?.data[0]);
    } catch (error) {
      console.error('Error fetching attendance status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start background location tracking
  const startBackgroundTracking = async (): Promise<void> => {
    try {
      await BackgroundService.start(
        trackLocationInBackground,
        backgroundTaskOptions,
      );
      console.log('Background tracking started');
    } catch (error) {
      console.error('Error starting background tracking:', error);
      Alert.alert('Error', 'Could not start background tracking.');
    }
  };

  // Stop background location tracking
  const stopBackgroundTracking = async (): Promise<void> => {
    if (!location.latitude) {
      Alert.alert(
        'Permission Denied',
        'Not able to track your location.\nPlease tur on location to continue.',
      );
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/attendance/checkout`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      setAttendanceStatus(null);
      await fetchAttendanceStatus();
      await BackgroundService.stop();
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  };

  // Handle attendance check-in
  const handleCheckIn = async (): Promise<void> => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert(
        'Permission Denied',
        'Location permission is required to start tracking.',
      );
      return;
    }
    if (!location.latitude) {
      Alert.alert(
        'Permission Denied',
        'Not able to track your location.\nPlease tur on location to continue.',
      );
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/attendance/checkin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      fetchAttendanceStatus();
    } catch (error) {
      console.error('Error during attendance check-in:', error);
    }
  };

  useEffect(() => {
    if (
      attendanceStatus?.status === 'Active' &&
      !BackgroundService.isRunning()
    ) {
      startBackgroundTracking();
    }
  }, [attendanceStatus]);

  const fetchMessagingToken = async (): Promise<void> => {
    try {
      const fcmtoken = await messaging().getToken();

      await fetch(`${apiUrl}/user/token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({messagingToken: fcmtoken}),
      });
    } catch (error) {
      console.error('Error fetching messaging token:', error);
    }
  };

  const requestNotificationPermissions = async (): Promise<void> => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted.');
      fetchMessagingToken();
    } else {
      console.log('Notification permission denied.');
    }
  };

  useEffect(() => {
    requestNotificationPermissions();
    handleForegroundNotifications();

    // Optional: Handle token refresh
    const unsubscribe = messaging().onTokenRefresh(fcmtoken => {
      fetch(`${apiUrl}/user/token`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({messagingToken: fcmtoken}),
      });
    });

    return unsubscribe;
  }, []);

  if (loading || locLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.DARK_GRAY} />
        <Text
          style={{marginTop: 15, textAlign: 'center', color: COLORS.DARK_GRAY}}>
          Fetching location ...
        </Text>
        <Text
          style={{
            marginTop: 10,
            textAlign: 'center',
            color: COLORS.ACCENT_ORANGE,
            paddingHorizontal: 20,
          }}>
          ⚠️ Please ensure the following permissions are granted:
          {'\n'}📍 Location Access (to determine your current location)
          {'\n'}🌐 Internet Access (to fetch map and location data)
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <MapPreview location={location} />
      <MarkAttendance
        handleCheckIn={handleCheckIn}
        stopTracking={stopBackgroundTracking}
        attendanceStatus={attendanceStatus}
        loading={loading}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    justifyContent: 'center',
  },
});
