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
  ScrollView,
} from 'react-native';
import { useAuth } from '../../../packages/shared/src/auth/AuthContext';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';

interface Props {
  onComplete?: () => void;
  navigation?: any;
  route?: any;
}

export const CompanySelectionScreen: React.FC<Props & { navigation?: any }> = ({ onComplete, navigation }) => {
  const [mode, setMode] = useState<'select' | 'create'>('create');
  const [companyName, setCompanyName] = useState('');
  const [dotNumber, setDotNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { createCompany, user } = useAuth();
  const currentTime = useCurrentTime();

  const handleComplete = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate('MainTabs');
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleCreateCompany = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    setLoading(true);
    const { error, company } = await createCompany(companyName.trim(), dotNumber.trim() || undefined);

    if (error) {
      Alert.alert('Error', error.message || 'Failed to create company');
    } else {
      Alert.alert(
        'Company Created',
        `Welcome to ${company?.name || 'your new company'}!`,
        [{ text: 'Continue', onPress: handleComplete }]
      );
    }
    setLoading(false);
  };

  // Basic "join" placeholder - for now just create. In future could add join by DOT or invite code.
  const handleJoinPlaceholder = () => {
    Alert.alert(
      'Join Existing Company',
      'To join an existing company, please ask your administrator for an invitation link or company code.\n\nFor now, please create a new company.',
      [{ text: 'OK', onPress: () => setMode('create') }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome, {user?.email?.split('@')[0] || 'User'}!</Text>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Let's get your company set up</Text>
        <Text style={styles.description}>
          To use laslogTMX, you need to be associated with a company. Create a new one or join an existing team.
        </Text>

        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'create' && styles.modeActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.modeText, mode === 'create' && styles.modeTextActive]}>Create New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'select' && styles.modeActive]}
            onPress={() => setMode('select')}
          >
            <Text style={[styles.modeText, mode === 'select' && styles.modeTextActive]}>Join Existing</Text>
          </TouchableOpacity>
        </View>

        {mode === 'create' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Company Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ACME Freight LLC"
              value={companyName}
              onChangeText={setCompanyName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>DOT Number (optional but recommended for MOTUS)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1234567"
              value={dotNumber}
              onChangeText={setDotNumber}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCreateCompany}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Create Company &amp; Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.description}>
              Joining an existing company requires an invitation from your administrator.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleJoinPlaceholder}>
              <Text style={styles.secondaryButtonText}>Request to Join a Company</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => setMode('create')}>
              <Text style={styles.linkText}>Or create a new company instead</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.note}>
          Your profile was automatically created. You can update your details later in Settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  modeTextActive: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  primaryButton: {
    backgroundColor: '#1E40AF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1E40AF',
    fontSize: 15,
    fontWeight: '500',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  linkText: {
    color: '#64748B',
    fontSize: 14,
  },
  note: {
    marginTop: 32,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
});