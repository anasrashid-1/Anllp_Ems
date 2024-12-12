import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { EyeIcon, EyeSlashIcon } from 'react-native-heroicons/solid';
import COLORS from '../../constants/colors';


interface InputProps {
  label: string;
  keyboardType: 'default' | 'numeric' | 'phone-pad' | 'decimal-pad' | 'visible-password' | 'twitter' | 'web-search' | 'url' | 'number-pad'; 
  onUpdateValue: (text: string) => void;
  value: string;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
  isPasswordVisible?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  keyboardType,
  onUpdateValue,
  value,
  secureTextEntry = false,
  showPasswordToggle = false,
  onTogglePassword,
  isPasswordVisible,
}) => {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType={keyboardType}
          onChangeText={onUpdateValue}
          value={value}
          secureTextEntry={secureTextEntry}
        />
         {showPasswordToggle && onTogglePassword && (
          <TouchableOpacity onPress={onTogglePassword} style={styles.icon}>
            {isPasswordVisible ? (
              <EyeIcon size={24} color="gray" />
            ) : (
              <EyeSlashIcon size={24} color="gray" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: COLORS.DARK_GRAY,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderColor: 'gray',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color:'black'
  },
  icon: {
    padding: 8,
  },
});
