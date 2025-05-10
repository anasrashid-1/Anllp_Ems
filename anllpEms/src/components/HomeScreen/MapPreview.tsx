import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Platform,
  Linking,
  AppState,
  ActivityIndicator,
} from 'react-native';
import {Button} from 'react-native-paper';
import {WebView} from 'react-native-webview';
import COLORS from '../../constants/colors';
//@ts-ignore
import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {AuthContext} from '../../store/auth-context';

export default function MapPreview({location, onRequestLocation}: any) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(true);
  const [isLocationValid, setIsLocationValid] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [_locationServicesEnabled, setLocationServicesEnabled] = useState(true);
  const {isDialogShowing} = useContext(AuthContext);
  const checkInterval = useRef<NodeJS.Timeout>();
  const appState = useRef(AppState.currentState);
  // Add a ref to track if dialog is showing
  // const isDialogShowing = useRef(false);

  // Check location validity
  useEffect(() => {
    const valid =
      location &&
      location.latitude !== 0 &&
      location.longitude !== 0 &&
      !isNaN(location.latitude) &&
      !isNaN(location.longitude);
    setIsLocationValid(valid);
    console.log('Location validity:', valid, location);

    if (hasPermission && !valid && onRequestLocation) {
      console.log(
        'Permission granted but no valid location - requesting location',
      );
      setLocationError('Getting your location...');
      onRequestLocation().catch((error: Error) => {
        console.log('Location request failed:', error);
        setLocationError('Failed to get location. Please try again.');
      });
    }
  }, [location, hasPermission, onRequestLocation]);

  // Check location services status (Android only)
  const checkLocationServices = useCallback(async () => {
    if (Platform.OS === 'android' && !isDialogShowing.current) {
      try {
        isDialogShowing.current = true;
        const enabled =
          await LocationServicesDialogBox.checkLocationServicesIsEnabled({
            message: `<font color=${COLORS.DARK_GRAY}>This app requires location services to be enabled</font>`,
            ok: 'ENABLE',
            cancel: 'CANCEL',
            enableHighAccuracy: true,
            showDialog: true,
            style: {
              backgroundColor: COLORS.WHITE,
              positiveButtonTextColor: COLORS.ACCENT_ORANGE,
              positiveButtonBackgroundColor: COLORS.WHITE,
              negativeButtonTextColor: COLORS.DARK_GRAY,
              negativeButtonBackgroundColor: COLORS.WHITE,
            },
          });
        setLocationServicesEnabled(enabled);
        isDialogShowing.current = false;
        return enabled;
      } catch (error) {
        console.log('Location services check error:', error);
        setLocationServicesEnabled(false);
        return false;
      } finally {
        isDialogShowing.current = false;
      }
    }
    return true; // For iOS, assume enabled
  }, [isDialogShowing]);

  // Continuous location services monitoring
  useEffect(() => {
    if (hasPermission) {
      // Check immediately
      checkLocationServices();

      // Then check every 10 seconds
      checkInterval.current = setInterval(() => {
        checkLocationServices();
      }, 10000);

      return () => {
        if (checkInterval.current) {
          clearInterval(checkInterval.current);
        }
      };
    }
  }, [hasPermission, checkLocationServices]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      async nextAppState => {
        console.log('App state changed to:', nextAppState);

        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          console.log('App returned to foreground - rechecking permissions');
          await checkPermissions();
        }

        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, []);

  // Check permissions on mount and when app returns from background
  useEffect(() => {
    console.log('Initial permission check');
    checkPermissions();

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('App state changed to:', nextAppState);
      if (nextAppState === 'active') {
        console.log('App returned to foreground - rechecking permissions');
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, []);

  const checkPermissions = async () => {
    try {
      console.log('Starting permission check');
      setIsCheckingPermission(true);

      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      });
      if (!permission) {
        console.error('Permission not supported on this platform');
        return false;
      }

      console.log(`Checking permission: ${permission}`);
      const status = await check(permission);
      console.log(`Permission status: ${status}`);

      const granted = status === RESULTS.GRANTED;
      setHasPermission(granted);
      console.log(`Permission granted: ${granted}`);

      return granted;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleGrantPermission = async () => {
    try {
      console.log('--- Permission flow started ---');
      setIsCheckingPermission(true);
      setLocationError('');

      // 1. First check/enable location services (Android only)
      if (Platform.OS === 'android' && !isDialogShowing.current) {
        console.log('Checking Android location services');
        isDialogShowing.current = true;
        await LocationServicesDialogBox.checkLocationServicesIsEnabled({
          message: `<font color=${COLORS.DARK_GRAY}>This app requires location services to be enabled</font>`,
          ok: 'ENABLE',
          cancel: 'NO',
          style: {
            backgroundColor: COLORS.WHITE,
            positiveButtonTextColor: COLORS.ACCENT_ORANGE,
            positiveButtonBackgroundColor: COLORS.WHITE,
            negativeButtonTextColor: COLORS.DARK_GRAY,
            negativeButtonBackgroundColor: COLORS.WHITE,
          },
        });
        console.log('Android location services check completed');
      }

      // 2. Check current permission status
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      });
      if (!permission) {
        console.error('Permission not supported on this platform');
        return;
      }

      console.log(`Requesting permission: ${permission}`);
      const status = await check(permission);
      console.log(`Current permission status: ${status}`);

      // 3. Handle different permission states
      switch (status) {
        case RESULTS.DENIED:
          console.log('Permission denied - requesting permission');
          const requestStatus = await request(permission);
          console.log(`Permission request result: ${requestStatus}`);

          if (requestStatus === RESULTS.GRANTED) {
            console.log('Permission granted after request');
            setHasPermission(true);
            // Request location immediately after getting permission
            if (onRequestLocation) {
              await onRequestLocation();
            }
          } else {
            console.log('Permission denied - opening settings');
            openAppSettings();
          }
          break;

        case RESULTS.BLOCKED:
          console.log('Permission blocked - opening settings');
          openAppSettings();
          break;

        case RESULTS.GRANTED:
          console.log('Permission already granted');
          setHasPermission(true);
          // Request location if we don't have a valid one
          if (onRequestLocation && !isLocationValid) {
            await onRequestLocation();
          }
          break;

        default:
          console.log('Unexpected permission status');
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      setLocationError('Permission request failed. Please try again.');
    } finally {
      isDialogShowing.current = false;
      console.log('--- Permission flow completed ---');
      setIsCheckingPermission(false);
    }
  };

  const openAppSettings = () => {
    console.log('Opening app settings');
    if (Platform.OS === 'android') {
      Linking.openURL(`package:com.anllpems`).catch(() => {
        console.log('Falling back to general settings');
        Linking.openSettings();
      });
    } else {
      Linking.openSettings();
    }
  };

  // Loading state
  if (isCheckingPermission) {
    console.log('Rendering loading indicator');
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  // Show permission prompt if we don't have permission OR valid location
  if (!hasPermission || !isLocationValid) {
    console.log(
      `Rendering permission prompt - hasPermission: ${hasPermission}, validLocation: ${isLocationValid}`,
    );
    return (
      <View style={[styles.container, {height: '100%', padding: 12}]}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {hasPermission
              ? locationError || '📍 Waiting for valid location...'
              : '🗺️ Location access required to view this map'}
          </Text>

          {!hasPermission ? (
            <Button
              mode="contained"
              buttonColor={COLORS.ACCENT_ORANGE}
              textColor={COLORS.WHITE}
              style={styles.button}
              onPress={handleGrantPermission}
              loading={isCheckingPermission}
              disabled={isCheckingPermission}>
              Grant Permission
            </Button>
          ) : (
            <Button
              mode="outlined"
              textColor={COLORS.ACCENT_ORANGE}
              style={styles.button}
              onPress={() => onRequestLocation?.()}
              loading={isCheckingPermission}
              disabled={isCheckingPermission}>
              Refresh Location
            </Button>
          )}
        </View>
      </View>
    );
  }

  // Show map when we have both permission and valid location
  console.log('Rendering map with valid location:', location);
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>OpenStreetMap</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
            html, body, #map {
                height: 100%;
                margin: 0;
                padding: 0;
            }
            #map {
                width: 100%;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <script>
            const map = L.map('map').setView([${location.latitude}, ${location.longitude}], 12); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            L.marker([${location.latitude}, ${location.longitude}]).addTo(map)
                .bindPopup('Your location!')
                .openPopup();
        </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{html: mapHtml}}
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '50%',
    width: '100%',
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: COLORS.DARK_GRAY,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 12,
    width: '80%',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: COLORS.DARK_GRAY,
  },
});
