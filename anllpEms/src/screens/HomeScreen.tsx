import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import BackgroundService from 'react-native-background-actions';
import Geolocation, { GeoPosition } from 'react-native-geolocation-service';
import requestPermissions from '../util/requestPermissions';
// import MapView, { Marker } from 'react-native-maps';


type regionType = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
const Home: React.FC = () => {
  const [isServiceRunning, setIsServiceRunning] = useState(false)
  const [region, setRegion] = useState<regionType>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

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
          console.log("getCurrentPosition called.")
          console.log(position);
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
    taskName: 'Example Task',
    taskTitle: 'Running Background Task',
    taskDesc: 'A background task running in an infinite loop.',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'yourSchemeHere://chat/jane',
    parameters: {
      delay: 10000, // Adjust delay as necessary
    },
    foreground: true,
  };

  // Start the background service
  const startTracking = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      Alert.alert('Permission Denied', 'Location permission is required to start tracking.');
      return;
    }

    try {
      setIsServiceRunning(true);
      await BackgroundService.start(getBackgroundLocation, options);
      console.log('Background service started');
    } catch (error) {
      console.error('Error starting background service:', error);
      Alert.alert('Error', 'Could not start background service.');
      setIsServiceRunning(false);
    }
  };

  // Stop the background service
  const stopTracking = async () => {
    try {
      await BackgroundService.stop();
      setIsServiceRunning(false);
      console.log('Background service stopped');
    } catch (error) {
      console.error('Error stopping background service:', error);
    }
  };


  // useEffect(() => {
  //   const getCurrentPosition = async () => {
  //     const hasPermissions = await requestPermissions();
  //     if (!hasPermissions) {
  //       Alert.alert('Permission Denied', 'Location permission is required.');
  //       return;
  //     }

  //     try {
  //       Geolocation.getCurrentPosition(
  //         (position) => {
  //           setRegion((prevRegion) => ({
  //             ...prevRegion,
  //             latitude: position.coords.latitude,
  //             longitude: position.coords.longitude,
  //           }));
  //         },
  //         (error) => {
  //           console.error(error);
  //         },
  //         { enableHighAccuracy: true, distanceFilter: 10 }
  //       );
  //     } catch (error) {
  //       console.error(error);
  //       Alert.alert('Error', 'Could not get current location.');
  //     }
  //   }


  //   getCurrentPosition();
  // }, []);




  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>
        {isServiceRunning ? 'Background service running' : 'Background service stopped'}
      </Text>
      <Button
        title={isServiceRunning ? 'Stop service' : 'Start service'}
        onPress={isServiceRunning ? stopTracking : startTracking}
      />




      <View style={styles.container} >
      
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
})

export default Home;