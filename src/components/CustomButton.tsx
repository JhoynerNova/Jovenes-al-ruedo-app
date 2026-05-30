import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
  style?: ViewStyle;
}

export function CustomButton({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
}: CustomButtonProps): React.JSX.Element {
  const getButtonStyles = (pressed: boolean) => {
    const baseStyle = [styles.button, style];

    if (pressed) {
      baseStyle.push(styles.pressed);
    }

    if (disabled || isLoading) {
      baseStyle.push(styles.disabled);
    } else {
      switch (variant) {
        case 'primary':
          baseStyle.push(styles.primary);
          break;
        case 'secondary':
          baseStyle.push(styles.secondary);
          break;
        case 'accent':
          baseStyle.push(styles.accent);
          break;
        case 'danger':
          baseStyle.push(styles.danger);
          break;
      }
    }

    return baseStyle as any;
  };

  const getTextStyle = () => {
    const textStyle = [styles.text];
    if (variant === 'secondary') {
      textStyle.push(styles.textSecondary);
    }
    return textStyle;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || isLoading}
      style={({ pressed }) => getButtonStyles(pressed)}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#5A3FA0' : '#FFFFFF'} size="small" />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    shadowColor: '#5A3FA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginVertical: 8,
  },
  primary: {
    backgroundColor: '#5A3FA0', // Primary Purple
  },
  secondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: '#5A3FA0',
    shadowOpacity: 0,
    elevation: 0,
  },
  accent: {
    backgroundColor: '#2EC4B6', // Teal
    shadowColor: '#2EC4B6',
  },
  danger: {
    backgroundColor: '#F2994A', // Orange as warning/danger
    shadowColor: '#F2994A',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  textSecondary: {
    color: '#E2E8F0',
  },
});
