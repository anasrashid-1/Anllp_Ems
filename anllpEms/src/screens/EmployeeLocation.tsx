import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';

interface LogEntry {
    attendanceId: number;
    latitude: number;
    locationId: number;
    loggedAt: string;
    longitude: number;
    userID: number;
    username: string;
}

interface TransformedLogEntry {
    userID: number;
    username: string;
    logs: {
        locationId: number;
        latitude: number;
        longitude: number;
        loggedAt: string;
    }[];
}

export default function EmployeeLocation({ route }: { route: { params: { id: number } } }) {
    const { id } = route.params;
    const [loading, setLoading] = useState<boolean>(false);
    const [logData, setLogData] = useState<{ [attendanceId: number]: TransformedLogEntry }>({});
    const { apiUrl, token } = useContext(AuthContext);

    const fetchLog = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${apiUrl}/attendance/logs/${id}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch attendance data.');
            }

            const result = await response.json();

            if (result.isError) {
                throw new Error(result.message || 'An error occurred.');
            }

            const transformedData = transformLogData(result.data || []);
            setLogData(transformedData);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const transformLogData = (data: LogEntry[]): { [attendanceId: number]: TransformedLogEntry } => {
        const map: { [attendanceId: number]: TransformedLogEntry } = {};

        data.forEach((entry) => {
            if (!map[entry.attendanceId]) {
                map[entry.attendanceId] = {
                    userID: entry.userID,
                    username: entry.username,
                    logs: [],
                };
            }

            if (isValidCoordinate(entry.latitude, entry.longitude)) {
                map[entry.attendanceId].logs.push({
                    locationId: entry.locationId,
                    latitude: entry.latitude,
                    longitude: entry.longitude,
                    loggedAt: entry.loggedAt,
                });
            }
        });

        return map;
    };

    const isValidCoordinate = (latitude: number, longitude: number): boolean => {
        return (
            typeof latitude === 'number' &&
            typeof longitude === 'number' &&
            !isNaN(latitude) &&
            !isNaN(longitude) &&
            latitude >= -90 &&
            latitude <= 90 &&
            longitude >= -180 &&
            longitude <= 180
        );
    };

    useEffect(() => {
        fetchLog();
    }, []);

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" style={styles.loader} />
            </View>
        );
    }

    const userLogs = logData[id]?.logs || [];
    const coordinates = userLogs
        .map((log) => ({
            latitude: log.latitude,
            longitude: log.longitude,
        }))
        .filter((coord) => isValidCoordinate(coord.latitude, coord.longitude));

    const getInitialRegion = (): Region => {
        if (coordinates.length === 0) {
            return {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
            };
        }

        const lats = coordinates.map((coord) => coord.latitude);
        const lngs = coordinates.map((coord) => coord.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        return {
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(0.1, (maxLat - minLat) * 1.5),
            longitudeDelta: Math.max(0.1, (maxLng - minLng) * 1.5),
        };
    };

    const renderUserInfo = () => (
        <View style={styles.scrollView}>
            {Object.entries(logData).map(([attendanceId, data]) => (
                <View key={attendanceId} style={styles.card}>
                    <Text style={styles.title}>Attendance ID: {attendanceId}</Text>
                    <Text style={styles.subTitle}>Employee ID: {data.userID}</Text>
                    <Text style={styles.subTitle}>Employee: {data.username}</Text>
                </View>
            ))}
        </View>
    );

    const renderMap = () => {
        if (coordinates.length === 0) {
            return (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: 0,
                        longitude: 0,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                    }}
                />
            );
        }

        return (
            <MapView
                style={styles.map}
                initialRegion={getInitialRegion()}
            >
                {coordinates.map((coord, index) => {
                    let pinColor = '#FF0000';

                    if (index === 0) {
                        pinColor = '#0000FF';
                    } else if (index === coordinates.length - 1) {
                        pinColor = '#00FF00';
                    }

                    return (
                        <Marker
                            key={`point-${index}`}
                            coordinate={coord}
                            pinColor={pinColor}
                            title={
                                index === 0
                                    ? 'Start Point'
                                    : index === coordinates.length - 1
                                        ? 'End Point'
                                        : `Point ${index + 1}`
                            }
                        />
                    );
                })}

                {coordinates.length > 1 && (
                    <Polyline
                        coordinates={coordinates}
                        strokeColor="#FF0000"
                        strokeWidth={4}
                    />
                )}
            </MapView>
        );
    };


    return (
        <View style={styles.mainContainer}>
            {renderUserInfo()}
            <View style={styles.mapSection}>{renderMap()}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingBottom: 0,
    },
    mapSection: {
        flex: 1,
        borderTopWidth: 1,
    },
    scrollView: {
        marginHorizontal: 8,
        marginVertical: 5,
    },
    map: {
        flex: 1,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        alignSelf: 'center',
    },
    card: {
        backgroundColor: COLORS.WHITE,
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 5,
    },
});
