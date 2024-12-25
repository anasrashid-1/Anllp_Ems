import React from 'react';
import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

export default function MapPreview() {
    return (
        <MapView
            initialRegion={{
                latitude: 28.6139,
                longitude: 77.2090,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
            }}
            style={{ height: '70%', width: '100%' }}
        />
    );
}

const styles = StyleSheet.create({});
