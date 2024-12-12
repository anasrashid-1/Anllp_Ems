import Toast from 'react-native-toast-message';

/**
 * Show a toast message
 * @param {string} type - The type of toast (success, error, info, etc.)
 * @param {string} title - The title text of the toast
 * @param {string} message - The message text of the toast
 */
export const showToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string): void => {
  Toast.show({
    type: type,
    text1: title,
    text2: message,
    onPress: () => {
      console.log('toast clicked');
    },
    visibilityTime: 2500,
  });
};
