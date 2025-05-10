import React, {FC, useContext, useState} from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import COLORS from '../../constants/colors';
import {ShoppingBagIcon, HomeIcon} from 'react-native-heroicons/solid';
import {AttendanceStatus} from '../../screens/HomeScreen';
import {formatTime} from '../../util/formatTime';
import Geolocation from '@react-native-community/geolocation';
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions';
//@ts-ignore
import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';
import {AuthContext} from '../../store/auth-context';

type MarkAttendanceProps = {
  handleCheckIn: () => Promise<void>;
  stopTracking: () => Promise<void>;
  attendanceStatus: AttendanceStatus | null;
  loading: boolean;
};

const MarkAttendance: FC<MarkAttendanceProps> = ({
  handleCheckIn,
  stopTracking,
  attendanceStatus,
  loading,
}) => {
  const [locationLoading, setLocationLoading] = useState(false);
  const date = new Date();
  const day = date.toLocaleDateString('en-US', {weekday: 'long'});
  const month = date.toLocaleDateString('en-US', {month: 'long'});
  const dayOfMonth = date.getDate();
  //   const isDialogShowing = useRef(false);
  const {isDialogShowing} = useContext(AuthContext);
  const today = `${day}, ${dayOfMonth} ${month}`;

  const checkLocationServices = async () => {
    if (Platform.OS === 'android') {
      try {
        isDialogShowing.current = true;
        const enabled =
          await LocationServicesDialogBox.checkLocationServicesIsEnabled({
            message:
              "<font color='#000000'>This app needs location services to track your attendance</font>",
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
        isDialogShowing.current = false;
        console.log('Location services enabled:', enabled);
        return enabled;
      } catch (error) {
        console.error('Location services error:', error);
        return false;
      }
    }
    return true; // For iOS, assume enabled
  };

  const verifyLocationAndProceed = async (action: 'checkIn' | 'checkOut') => {
    setLocationLoading(true);
    try {
      // 1. Check location services are enabled
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        throw new Error('Please enable location services to continue');
      }

      // 2. Check location permission
      const permission = Platform.select({
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
      });

      const permissionStatus = await check(permission!);

      if (permissionStatus === RESULTS.DENIED) {
        const requestResult = await request(permission!);
        if (requestResult !== RESULTS.GRANTED) {
          throw new Error('Location permission required');
        }
      } else if (permissionStatus !== RESULTS.GRANTED) {
        throw new Error('Location permission not granted');
      }

      // 3. Get current position (we don't need to store it, just verify we can get it)
      await new Promise<void>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          () => resolve(), // Success - we don't need the position object
          error => {
            console.error('Geolocation error:', error);
            reject(new Error('Could not get your current location'));
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
        );
      });

      //   const {latitude, longitude} = position.coords;

      // 4. Proceed with the action
      if (action === 'checkIn') {
        await handleCheckIn();
      } else {
        await stopTracking();
      }
    } catch (error) {
      //   Alert.alert(
      //     'Location Required',
      //     error.message ||
      //       'Could not verify your location. Please ensure location services and permissions are enabled.',
      //     [{text: 'OK'}],
      //   );
      //   isDialogShowing.current = true;
      //   await LocationServicesDialogBox.checkLocationServicesIsEnabled({
      //     message: `<font color=${COLORS.DARK_GRAY}>Could not verify your location. Please ensure location services and permissions are enabled.</font>`,
      //     ok: 'YES',
      //     cancel: 'NO',
      //     style: {
      //       backgroundColor: COLORS.WHITE,
      //       positiveButtonTextColor: COLORS.ACCENT_ORANGE,
      //       positiveButtonBackgroundColor: COLORS.WHITE,
      //       negativeButtonTextColor: COLORS.DARK_GRAY,
      //       negativeButtonBackgroundColor: COLORS.WHITE,
      //     },
      //   });
      console.error('Location verification error:', error);
      isDialogShowing.current = false;
    } finally {
      setLocationLoading(false);
      isDialogShowing.current = false;
    }
  };

  const handlePress = async () => {
    if (attendanceStatus?.status === 'Active') {
      await verifyLocationAndProceed('checkOut');
    } else {
      await verifyLocationAndProceed('checkIn');
    }
  };

  const formatSessionDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hr ${remainingMinutes} min`;
  };

  if (loading || locationLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.DARK_GRAY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{today}</Text>

      <View style={styles.card}>
        {attendanceStatus?.onLeave ? (
          <Text style={styles.leaveText}>Enjoy your day off!</Text>
        ) : (
          <>
            {!attendanceStatus?.checkOutTime && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  {attendanceStatus?.status === 'Active'
                    ? "Let's get to home"
                    : "Let's get to work"}
                </Text>
                {attendanceStatus?.status === 'Active' ? (
                  <HomeIcon size={32} color={COLORS.ACCENT_ORANGE} />
                ) : (
                  <ShoppingBagIcon size={32} color={COLORS.ACCENT_ORANGE} />
                )}
              </View>
            )}

            {attendanceStatus?.checkOutTime ? (
              <Text style={styles.doneText}>You're done for today!</Text>
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  attendanceStatus?.status === 'Active'
                    ? styles.activeButton
                    : styles.inactiveButton,
                ]}
                onPress={handlePress}
                disabled={loading || locationLoading}>
                <Text style={styles.buttonText}>
                  {attendanceStatus?.status === 'Active'
                    ? 'Check Out'
                    : 'Check In'}
                </Text>
              </TouchableOpacity>
            )}

            {attendanceStatus?.checkOutTime ? (
              <>
                <Text style={styles.sessionText}>
                  You Started at: {formatTime(attendanceStatus?.checkInTime)},
                  Ended at: {formatTime(attendanceStatus?.checkOutTime)}
                </Text>
                <Text style={styles.sessionText}>
                  Session Duration:{' '}
                  {formatSessionDuration(
                    attendanceStatus?.sessionDuration || 0,
                  )}
                </Text>
              </>
            ) : (
              <Text style={styles.infoText}>
                {!attendanceStatus?.checkInTime
                  ? 'Please check in to continue'
                  : `You have checked in at ${formatTime(
                      attendanceStatus?.checkInTime,
                    )}`}
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateText: {
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.DARK_GRAY,
    textAlign: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  activeButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  inactiveButton: {
    backgroundColor: COLORS.ACCENT_ORANGE,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  leaveText: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.PRIMARY_GREEN,
    textAlign: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.MEDIUM_GRAY,
    marginRight: 8,
  },
  doneText: {
    fontWeight: '600',
    fontSize: 16,
    color: COLORS.ACCENT_ORANGE,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 8,
  },
  sessionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.MEDIUM_GRAY,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default MarkAttendance;
