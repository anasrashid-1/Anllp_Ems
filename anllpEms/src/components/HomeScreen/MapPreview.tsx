import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import requestPermissions from '../../util/requestPermissions';

export default function MapPreview() {
    const [location, setLocation] = useState({ latitude: 28.6139, longitude: 77.2090 });

    // Request location permission and get current position
    useEffect(() => {
        const requestPermissionAndFetchLocation = async () => {
            const hasPermissions = await requestPermissions();
            if (!hasPermissions) {
                Alert.alert('Permission Denied', 'Location permission is required to start tracking.');
                return;
            }

            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                },
                (error) => {
                    console.error(error);
                },
                { enableHighAccuracy: true, distanceFilter: 10 }
            );

        };

        requestPermissionAndFetchLocation();
    }, []);

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
                source={{ html: mapHtml }}
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
});
