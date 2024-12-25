import React, { useContext, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import Geolocation from 'react-native-geolocation-service';
import MapPreview from '../components/HomeScreen/MapPreview';
import MarkAttendance from '../components/HomeScreen/MarkAttendance';
import requestPermissions from '../util/requestPermissions';
import { AuthContext } from '../store/auth-context';


type regionType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
const Home: React.FC = () => {
  const [isServiceRunning, setIsServiceRunning] = useState(false); 
  const [attendancestatus, setAttendanceStatus] = useState(null);
  const [region, setRegion] = useState<regionType>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const { apiUrl, token } = useContext(AuthContext);

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
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('getCurrentPosition called.');
          console.log("position---->", position);
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
    taskName: 'Example Task1',
    taskTitle: 'Running Background Task',
    taskDesc: 'A background task running in an infinite loop.',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'yourSchemeHere://chat/jane',
    parameters: {
      delay: 1000,
    },
    foreground: true,
  };


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
    // try {
    //   const res = await fetch(`${apiUrl}/attendance/checkin`, {
    //     method: 'POST',
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({}),
    //   });

    //   if (!res.ok) {
    //     throw new Error(`HTTP error! Status: ${res.status}`);
    //   }
    //   getAttenceSatus();
    //   try {
    setIsServiceRunning(true);
    await BackgroundService.start(getBackgroundLocation, options);
    //   console.log('Background service started');
    // } catch (error) {
    //   console.error('Error starting background service:', error);
    //   Alert.alert('Error', 'Could not start background service.');
    //   setIsServiceRunning(false);
    // }
    // } catch (error) {
    //   console.error('Error during attendance check-in:', error);
    // }

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
        setIsServiceRunning(false);
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
      <View style={styles.container} >
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
