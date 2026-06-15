import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TroubleshootingItem } from '../types';

interface Props {
  item: TroubleshootingItem;
}

export const ErrorSolutionCard: React.FC<Props> = ({ item }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.title}>{item.title}</Text>
      </View>
      <Text style={styles.description}>{item.description}</Text>

      {expanded && (
        <View style={styles.solutions}>
          <Text style={styles.solutionsTitle}>Recommended Solutions:</Text>
          {item.solutions.map((sol, idx) => (
            <View key={idx} style={styles.solutionRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.solution}>{sol}</Text>
            </View>
          ))}
          {item.commonFixTime && (
            <Text style={styles.timeNote}>Typical resolution: {item.commonFixTime}</Text>
          )}
        </View>
      )}

      <Text style={styles.toggle}>{expanded ? 'Hide solutions ▲' : 'Tap to view solutions ▼'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    marginBottom: 6,
  },
  category: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  description: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  solutions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  solutionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  solutionRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bullet: {
    color: '#1E40AF',
    marginRight: 6,
    fontSize: 14,
  },
  solution: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 19,
  },
  timeNote: {
    marginTop: 8,
    fontSize: 12,
    fontStyle: 'italic',
    color: '#64748B',
  },
  toggle: {
    marginTop: 10,
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
});
