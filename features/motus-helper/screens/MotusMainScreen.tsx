import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useCurrentTime } from '../../../packages/shared/src/hooks/useCurrentTime';
import { StatusBadge } from '../components/StatusBadge';

interface Props {
  navigation?: any; // for demo sub-navigation
  onNavigate?: (screen: string, params?: any) => void;
  route?: any;
}

export const MotusMainScreen: React.FC<Props> = ({ onNavigate, navigation }) => {
  const currentTime = useCurrentTime();

  const navigateTo = (screen: string, params?: any) => {
    if (onNavigate) onNavigate(screen, params);
    else if (navigation && navigation.navigate) navigation.navigate(screen, params);
  };

  const menuItems = [
    {
      key: 'status-checker',
      title: 'FMCSA Status Checker',
      subtitle: 'Check DOT authority & OOS status using public data',
      icon: '🔍',
      action: () => navigateTo('StatusChecker'),
    },
    {
      key: 'dot-flow',
      title: 'Guided DOT Linking / Claim',
      subtitle: 'Step-by-step process to claim or link your DOT number',
      icon: '🔗',
      action: () => navigateTo('DotClaimingFlow'),
    },
    {
      key: 'troubleshooting',
      title: 'Common Error Troubleshooting',
      subtitle: 'Solutions for frequent MOTUS / FMCSA errors',
      icon: '🛠️',
      action: () => navigateTo('Troubleshooting'),
    },
    {
      key: 'documents',
      title: 'Document Upload & Tracking',
      subtitle: 'Submit and track manual filings (MCS-150, insurance, etc.)',
      icon: '📄',
      action: () => navigateTo('DocumentTracker'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>MOTUS Helper</Text>
            <Text style={styles.subtitle}>FMCSA Compliance Assistant</Text>
          </View>
          <View style={styles.timePill}>
            <Text style={styles.timeText}>{currentTime}</Text>
          </View>
        </View>

        <Text style={styles.description}>
          High-priority tool to resolve current FMCSA MOTUS linking, authority, and submission issues.
        </Text>

        {menuItems.map((item) => (
          <TouchableOpacity key={item.key} style={styles.card} onPress={item.action} activeOpacity={0.85}>
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.footer}>
          <StatusBadge status="Active" />
          <Text style={styles.footerText}>Data sourced from public FMCSA systems where available.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 2,
  },
  timePill: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIcon: {
    fontSize: 26,
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 20,
    color: '#94A3B8',
    marginLeft: 8,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    opacity: 0.8,
  },
  footerText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
});
