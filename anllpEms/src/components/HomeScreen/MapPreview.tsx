import React from 'react';
import { DevSettings, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import COLORS from '../../constants/colors';
import LocationServicesDialogBox from 'react-native-android-location-services-dialog-box';


export default function MapPreview({ location }: any) {

    const handleGrantPermission = () => {
        LocationServicesDialogBox.checkLocationServicesIsEnabled({
            message: `<font color=${COLORS.DARK_GRAY}>Want to use location services?</font>`,
            ok: 'YES',
            cancel: 'NO',
            style: {
                backgroundColor: COLORS.WHITE,
                positiveButtonTextColor: COLORS.ACCENT_ORANGE,
                positiveButtonBackgroundColor: COLORS.WHITE,
                negativeButtonTextColor: COLORS.DARK_GRAY,
                negativeButtonBackgroundColor: COLORS.WHITE,
            },
        }).then(function (success: any) {
            console.log(success);
            DevSettings.reload();
        }).catch((error: { message: any; }) => {
            console.log(error.message);
        });
    };

    if (!location?.latitude || !location?.longitude) {
        return (
            // eslint-disable-next-line react-native/no-inline-styles
            <View style={[styles.container, { height: '100%', padding: 12 }]}>
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                        🗺️ Location not found. 📍 Please turn on location service to continue.
                    </Text>
                    <Button labelStyle={{ color: COLORS.ACCENT_ORANGE }} onPress={handleGrantPermission}>Grant Permission</Button>
                </View>
            </View>
        );
    }

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
    placeholder: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    placeholderText: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
        marginBottom: 8,
    },
});
