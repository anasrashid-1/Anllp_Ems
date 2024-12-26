/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import BackgroundService, { BackgroundTaskOptions } from 'react-native-background-actions';
import Geolocation, { GeolocationResponse, GeolocationError } from '@react-native-community/geolocation';
import MapPreview from '../components/HomeScreen/MapPreview';
import MarkAttendance from '../components/HomeScreen/MarkAttendance';
import requestPermissions from '../util/requestPermissions';
import { AuthContext } from '../store/auth-context';

export interface AttendanceStatus {
  attendanceId: string;
  status: 'Active' | 'Inactive';
  onLeave?: boolean;
  checkOutTime?: string;
  sessionDuration?: number;
}

const Home: React.FC = () => {
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const { apiUrl, token } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(false);

  // Post coordinates to the server
  const logLocation = async (latitude: number, longitude: number): Promise<void> => {
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
      Alert.alert('Error', 'Failed to connect to the server. Please try again later.');
    }
  };

  // Sleep function for delays in background task
  const sleep = (time: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, time));

  // The background task that runs in a loop
  const trackLocationInBackground = async (taskDataArguments?: { delay: number }): Promise<void> => {
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
          const { latitude, longitude } = position.coords;
          await logLocation(latitude, longitude);
        },
        (error: GeolocationError) => {
          console.error('Geolocation Error:', error);
        },
        { enableHighAccuracy: true, distanceFilter: 10 }
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
    parameters: {
      delay: 10000, // 10 seconds
    },
    foreground: true,
  };

  // Fetch attendance status
  const fetchAttendanceStatus = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/attendance/status`, {
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
      await BackgroundService.start(trackLocationInBackground, backgroundTaskOptions);
      console.log('Background tracking started');
    } catch (error) {
      console.error('Error starting background tracking:', error);
      Alert.alert('Error', 'Could not start background tracking.');
    }
  };

  // Stop background location tracking
  const stopBackgroundTracking = async (): Promise<void> => {
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

      await BackgroundService.stop();
      console.log('Background tracking stopped');
    } catch (error) {
      console.error('Error stopping background tracking:', error);
    }
  };

  // Handle attendance check-in
  const handleCheckIn = async (): Promise<void> => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Denied', 'Location permission is required to start tracking.');
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
    if (attendanceStatus?.status === 'Active' && !BackgroundService.isRunning()) {

      startBackgroundTracking();
    }
  }, [attendanceStatus]);

  useEffect(() => {
    fetchAttendanceStatus();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapPreview />
      <View style={styles.container}>
        <MarkAttendance
          handleCheckIn={handleCheckIn}
          stopTracking={stopBackgroundTracking}
          attendanceStatus={attendanceStatus}
          loading={loading}
        />
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
});

export default Home;