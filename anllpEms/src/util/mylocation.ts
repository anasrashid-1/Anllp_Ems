import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const requestPermissionAndFetchLocation = async (): Promise<{
  granted: boolean;
  location: {latitude: number; longitude: number} | null;
}> => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );

      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        return {granted: false, location: null};
      }
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          resolve({granted: true, location: {latitude, longitude}});
        },
        error => {
          console.error('Location error:', error);
          resolve({granted: false, location: null});
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    });
  } catch (err) {
    console.error('Permission or location error:', err);
    return {granted: false, location: null};
  }
};
