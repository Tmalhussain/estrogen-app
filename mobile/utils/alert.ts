/**
 * Cross-platform alert utility.
 *
 * React Native's Alert.alert() doesn't work reliably on web
 * (multi-button alerts fail). This helper uses window.alert/confirm
 * on web and Alert.alert on native.
 */

import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Show a cross-platform alert.
 *
 * - 1 button (or no buttons): shows an alert with OK
 * - 2 buttons: shows a confirm dialog (first = cancel, second = action)
 * - 3+ buttons: falls back to confirm for the last non-cancel button
 */
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web path
  const displayMsg = message ? `${title}\n\n${message}` : title;

  if (!buttons || buttons.length <= 1) {
    window.alert(displayMsg);
    buttons?.[0]?.onPress?.();
    return;
  }

  // 2+ buttons: use confirm
  const cancelBtn = buttons.find((b) => b.style === 'cancel');
  const actionBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];

  if (window.confirm(displayMsg)) {
    actionBtn?.onPress?.();
  } else {
    cancelBtn?.onPress?.();
  }
}
