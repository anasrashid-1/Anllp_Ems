import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import Geolocation from '@react-native-community/geolocation';
import MapPreview from '../components/HomeScreen/MapPreview';
import MarkAttendance from '../components/HomeScreen/MarkAttendance';
import requestPermissions from '../util/requestPermissions';
import { AuthContext } from '../store/auth-context';

const Home: React.FC = () => {
  const [attendancestatus, setAttendanceStatus] = useState(null);
  const { apiUrl, token } = useContext(AuthContext);

  // Post coordinates to the server
  const postCoordinates = async (latitude: number, longitude: number) => {
    if (!attendancestatus?.attendanceId) {
      console.warn('Attendance ID is not available.');
      return;
    }

    try {
      const payload = {
        attendanceId: attendancestatus.attendanceId,
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
      Alert.alert('Error', 'Failed to connect to the server. Please try again later.');
    }
  };

  // Sleep function for delays in background task
  const sleep = (time: number) => new Promise<void>((resolve) => setTimeout(resolve, time));

  // The background task that runs in a loop
  const getBackgroundLocation = async (taskDataArguments: any) => {
    const { delay } = taskDataArguments;

    // Set the initial notification
    await BackgroundService.updateNotification({
      taskTitle: 'Background Task Running',
      taskDesc: 'Starting Location Tracking',
      color: '#ff00ff',
      taskIcon: {
        name: 'ic_launcher',
        type: 'mipmap',
      },
    });

    while (BackgroundService.isRunning()) {
      // Fetch the current location and post coordinates in background task
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await postCoordinates(latitude, longitude);
        },
        (error) => {
          console.error(error);
        },
        { enableHighAccuracy: true, distanceFilter: 10 }
      );

      await sleep(delay);
    }
  };

  // Options for the background task
  const options = {
    taskName: 'LocationTracking',
    taskTitle: 'Running Background Task',
    taskDesc: 'Tracking your location in the background.',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    parameters: {
      // delay: 1800000, 
      delay: 10000, 
    },
    foreground: true,
  };

  // Get attendance status
  const getAttenceSatus = async () => {
    try {
      const res = await fetch(`${apiUrl}/attendance/status`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      const data = await res.json();
      setAttendanceStatus(data?.data[0]);
      if (data?.data[0]?.status === "Active") {
        try {
          await BackgroundService.start(getBackgroundLocation, options);
          console.log('Background service started');
        } catch (error) {
          console.error('Error starting background service:', error);
          Alert.alert('Error', 'Could not start background service.');
        }
      }
    } catch (error) {
      console.error('Error during getAttenceSatus:', error);
    }
  };

  useEffect(() => {
    getAttenceSatus();
  }, []);

  // Start the background service
  const startTracking = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Denied', 'Location permission is required to start tracking.');
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/attendance/checkin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      getAttenceSatus(); // Refresh attendance status after check-in


    } catch (error) {
      console.error('Error during attendance check-in:', error);
    }
  };

  // Stop the background service
  const stopTracking = async () => {
    try {
      const res = await fetch(`${apiUrl}/attendance/checkout`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      getAttenceSatus();

      try {
        await BackgroundService.stop();
        console.log('Background service stopped');
      } catch (error) {
        console.error('Error stopping background service:', error);
      }
    } catch (error) {
      console.error('Error during attendance check-out:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapPreview />
      <View style={styles.container}>
        <MarkAttendance startBackgroundLocation={startTracking} stopTracking={stopTracking} attendancestatus={attendancestatus} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    alignSelf: 'center',
    bottom: 100,
    width: '130%',
  },
  map: {
    flex: 1,
  },
});

export default Home;
