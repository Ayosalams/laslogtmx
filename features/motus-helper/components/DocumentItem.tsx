import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { MotusSubmission } from '../types';
import { StatusBadge } from './StatusBadge';

interface Props {
  submission: MotusSubmission;
  onRemove?: (id: string) => void;
}

export const DocumentItem: React.FC<Props> = ({ submission, onRemove }) => {
  const { isMilitaryTime } = useSettings();
  const time = formatMessageTime(submission.uploadedAt, isMilitaryTime);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fileName}>{submission.fileName}</Text>
          <Text style={styles.meta}>
            {submission.type} • DOT {submission.dotNumber}
          </Text>
          <Text style={styles.time}>
            Submitted {time} (military time)
          </Text>
        </View>
        <StatusBadge status={submission.status} size="small" />
      </View>

      {submission.trackingNumber && (
        <Text style={styles.tracking}>Tracking: {submission.trackingNumber}</Text>
      )}

      {submission.notes && <Text style={styles.notes}>{submission.notes}</Text>}

      <View style={styles.actions}>
        {onRemove && (
          <TouchableOpacity onPress={() => onRemove(submission.id)} style={styles.removeBtn}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.viewBtn}>
          <Text style={styles.viewText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  meta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  time: {
    fontSize: 12,
    color: '#1E40AF',
    marginTop: 2,
    fontWeight: '500',
  },
  tracking: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#475569',
  },
  notes: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 12,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removeText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  viewBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewText: {
    color: '#1E40AF',
    fontWeight: '600',
    fontSize: 13,
  },
});
