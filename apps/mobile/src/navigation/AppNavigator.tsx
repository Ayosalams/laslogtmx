import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Auth screens
import { LoginScreen } from '../../../../features/auth/screens/LoginScreen';
import { SignupScreen } from '../../../../features/auth/screens/SignupScreen';
import { CompanySelectionScreen } from '../../../../features/auth/screens/CompanySelectionScreen';

// Feature entry points and sub screens
import { ChatListScreen } from '../../../../features/chat/screens/ChatListScreen';
import { ChatRoomScreen } from '../../../../features/chat/screens/ChatRoomScreen';

import { MotusMainScreen } from '../../../../features/motus-helper/screens/MotusMainScreen';
import { DotClaimingFlow } from '../../../../features/motus-helper/screens/DotClaimingFlow';
import { TroubleshootingScreen } from '../../../../features/motus-helper/screens/TroubleshootingScreen';
import { StatusCheckerScreen } from '../../../../features/motus-helper/screens/StatusCheckerScreen';
import { DocumentTrackerScreen } from '../../../../features/motus-helper/screens/DocumentTrackerScreen';

import { ReceiptCaptureScreen } from '../../../../features/receipt-ocr/screens/ReceiptCaptureScreen';
import { ReceiptCorrectionScreen } from '../../../../features/receipt-ocr/screens/ReceiptCorrectionScreen';
import { LoadDetailScreen } from '../../../../features/load-board/screens/LoadDetailScreen';

// Tab Navigator
import MainTabNavigator from './MainTabNavigator';

// Shared
import { useAuth } from '../../../../packages/shared/src/auth/AuthContext';

// Types for navigation (can be expanded)
export type RootStackParamList = {
  // Auth
  Login: undefined;
  Signup: undefined;
  CompanySelection: undefined;

  // Main / Features
  Main: undefined; // Placeholder for tab-like or home
  ChatList: undefined;
  ChatRoom: { channelId: string; channelName: string };
  MotusMain: undefined;
  DotClaimingFlow: undefined;
  Troubleshooting: undefined;
  StatusChecker: undefined;
  DocumentTracker: undefined;
  Settings: undefined;
  ReceiptCapture: undefined;
  ReceiptCorrection: import('../../../../features/receipt-ocr/types').ReceiptCaptureParams;
  LoadDetail: { loadId: string };
};

const Stack = createNativeStackNavigator<any>(); // Use any for flexibility with custom prop interfaces in feature screens

// Note: MainTabNavigator is now imported and used as the main authenticated experience.
// The stack still allows pushing detail screens (ChatRoom, Motus flows, etc.) over the tabs.

function AppNavigator() {
  const { isAuthenticated, hasCompany, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? (hasCompany ? 'MainTabs' : 'CompanySelection') : 'Login'}
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !hasCompany ? (
          <Stack.Screen name="CompanySelection" component={CompanySelectionScreen} />
        ) : (
          <>
            {/* Main authenticated experience with Bottom Tabs */}
            <Stack.Screen 
              name="MainTabs" 
              component={MainTabNavigator} 
              options={{ headerShown: false }} 
            />

            {/* Stack screens pushed over the tabs (e.g. from ChatList or MotusMain) */}
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
            <Stack.Screen name="DotClaimingFlow" component={DotClaimingFlow} />
            <Stack.Screen name="Troubleshooting" component={TroubleshootingScreen} />
            <Stack.Screen name="StatusChecker" component={StatusCheckerScreen} />
            <Stack.Screen name="DocumentTracker" component={DocumentTrackerScreen} />
            <Stack.Screen name="ReceiptCapture" component={ReceiptCaptureScreen} />
            <Stack.Screen name="ReceiptCorrection" component={ReceiptCorrectionScreen} />
            <Stack.Screen name="LoadDetail" component={LoadDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  hubContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  note: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#713f12',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;