import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomInputProps extends TextInputProps {
  label: string;
  error?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  isPassword?: boolean;
}

export function CustomInput({
  label,
  error,
  iconName,
  isPassword = false,
  style,
  ...restProps
}: CustomInputProps): React.JSX.Element {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isFocused && styles.labelFocused, !!error && styles.labelError]}>
        {label}
      </Text>
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {iconName && (
          <Ionicons
            name={iconName}
            size={20}
            color={error ? '#F2994A' : isFocused ? '#5A3FA0' : '#A0AEC0'}
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, style]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          placeholderTextColor="#A0AEC0"
          {...restProps}
        />

        {isPassword && (
          <TouchableOpacity onPress={togglePasswordVisibility} style={styles.passwordToggle}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={isFocused ? '#5A3FA0' : '#A0AEC0'}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#CBD5E1', // slate-300 default for dark background
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  labelFocused: {
    color: '#5A3FA0', // Primary Purple
  },
  labelError: {
    color: '#F2994A', // Warning Orange
  },
  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: '#5A3FA0',
    backgroundColor: 'rgba(90, 63, 160, 0.05)',
  },
  inputError: {
    borderColor: '#F2994A',
    backgroundColor: 'rgba(242, 153, 74, 0.05)',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'System',
  },
  passwordToggle: {
    padding: 6,
  },
  errorText: {
    color: '#F2994A',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
