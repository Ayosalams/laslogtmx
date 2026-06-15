import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlowStep } from '../types';

const STEPS: { key: FlowStep; label: string }[] = [
  { key: 'enter-dot', label: 'DOT #' },
  { key: 'verify-status', label: 'Verify' },
  { key: 'claim-account', label: 'Claim' },
  { key: 'upload-docs', label: 'Docs' },
  { key: 'confirmation', label: 'Done' },
];

interface Props {
  current: FlowStep;
}

export const StepIndicator: React.FC<Props> = ({ current }) => {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isComplete = index < currentIndex;

        return (
          <React.Fragment key={step.key}>
            <View style={[styles.circle, isActive && styles.active, isComplete && styles.complete]}>
              <Text style={[styles.number, (isActive || isComplete) && styles.activeNumber]}>
                {index + 1}
              </Text>
            </View>
            {index < STEPS.length - 1 && (
              <View style={[styles.line, isComplete && styles.lineComplete]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  active: {
    borderColor: '#1E40AF',
    backgroundColor: '#1E40AF',
  },
  complete: {
    borderColor: '#1E40AF',
    backgroundColor: '#DBEAFE',
  },
  number: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  activeNumber: {
    color: '#fff',
  },
  line: {
    width: 32,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  lineComplete: {
    backgroundColor: '#1E40AF',
  },
});
