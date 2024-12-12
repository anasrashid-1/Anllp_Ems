import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Toast, { ToastConfig as ToastConfigType, ToastConfigParams } from 'react-native-toast-message';
import { CheckCircleIcon, ExclamationCircleIcon } from 'react-native-heroicons/solid';

interface ToastInternalState extends ToastConfigParams<any> {
  text1: string;
  text2: string;
}

const ToastConfig: ToastConfigType = {
  success: (params: ToastConfigParams<any>) => {
    const { text1, text2 } = params;
    return (
      <View style={[styles.toastContainer, { backgroundColor: '#28a745' }]}>
        <CheckCircleIcon size={28} color="white" style={styles.toastIcon} />
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          <Text style={styles.toastMessage}>{text2}</Text>
        </View>
      </View>
    );
  },
  error: (params: ToastConfigParams<any>) => {
    const { text1, text2 } = params;
    return (
      <View style={[styles.toastContainer, { backgroundColor: '#dc3545' }]}>
        <ExclamationCircleIcon size={28} color="white" style={styles.toastIcon} />
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastTitle}>{text1}</Text>
          <Text style={styles.toastMessage}>{text2}</Text>
        </View>
      </View>
    );
  },
};

export default ToastConfig;

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    width: '90%',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: '5%',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  toastIcon: {
    marginRight: 10,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toastMessage: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
  },
});
