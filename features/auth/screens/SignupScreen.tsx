import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { getDeviceFingerprint } from '../../../packages/shared/src/fraud/fingerprint';
import type { BiometricStatus } from '../../../packages/shared/src/biometrics/types';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';

interface Props {
  onNavigate?: (screen: string) => void;
  navigation?: any;
  route?: any;
}

export const SignupScreen: React.FC<Props & { navigation?: any }> = ({ onNavigate, navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, verifyHighRiskAction } = useAuth();
  const currentTime = useCurrentTime();

  const goToLogin = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('Login');
    } else if (onNavigate) {
      onNavigate('login');
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const biometric = await verifyHighRiskAction('signup');
    if (!biometric.verified) {
      Alert.alert(
        'Verification Required',
        biometric.error ?? 'Biometric verification failed. Please try again.'
      );
      setLoading(false);
      return;
    }

    const fingerprint = await getDeviceFingerprint();
    const { error, needsCompany } = await signUp(
      email.trim(),
      password,
      fullName.trim() || undefined,
      { fingerprint, biometricStatus: biometric.biometricStatus as BiometricStatus }
    );

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else if (needsCompany) {
      // AuthProvider will detect new session; App will route to company flow
      Alert.alert('Success', 'Account created! Please set up your company.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>laslogTMX</Text>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Create your account</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name (optional)"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={goToLogin}>
            <Text style={styles.link}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
  },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
  },
  link: {
    color: '#1E40AF',
    fontSize: 14,
    fontWeight: '600',
  },
});