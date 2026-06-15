import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettings } from '../../../packages/shared/src/context/SettingsContext';
import { formatMessageTime } from '../../../packages/shared/src/utils/formatTime';
import { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  currentUserId?: string;
  onReport?: (message: ChatMessage) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
  message,
  currentUserId,
  onReport,
}) => {
  const { isMilitaryTime } = useSettings();
  const isSystem = message.is_system === true;
  const isOwn = !isSystem && currentUserId ? message.user_id === currentUserId : false;
  const timestamp = formatMessageTime(message.created_at, isMilitaryTime);

  const handleReport = () => {
    if (onReport) {
      onReport(message);
    }
  };

  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemLabel}>laslogTMX Support</Text>
          <Text style={styles.systemContent}>{message.content}</Text>
          <Text style={styles.systemTimestamp}>{timestamp}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          message.reported && styles.bubbleReported,
        ]}
      >
        {!isOwn && message.sender_name && (
          <Text style={styles.sender}>{message.sender_name}</Text>
        )}

        <Text
          style={[
            styles.content,
            isOwn ? styles.contentOwn : styles.contentOther,
            message.reported && styles.contentReported,
          ]}
        >
          {message.content}
        </Text>

        <View style={styles.metaRow}>
          <Text style={[styles.timestamp, isOwn ? styles.timestampOwn : styles.timestampOther]}>
            {timestamp}
          </Text>

          {message.reported && (
            <View style={styles.reportedBadge}>
              <Text style={styles.reportedText}>REPORTED</Text>
            </View>
          )}

          {!isOwn && !message.reported && onReport && (
            <TouchableOpacity onPress={handleReport} style={styles.reportBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.reportIcon}>⚠︎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  bubbleOwn: {
    backgroundColor: '#1E40AF', // professional navy blue
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 18,
  },
  bubbleOther: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 18,
  },
  bubbleReported: {
    opacity: 0.65,
    backgroundColor: '#FEE2E2',
  },
  sender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
  },
  contentOwn: {
    color: '#fff',
  },
  contentOther: {
    color: '#1E293B',
  },
  contentReported: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.75,
  },
  timestampOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  timestampOther: {
    color: '#64748B',
  },
  reportedBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 6,
  },
  reportedText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  reportBtn: {
    marginLeft: 8,
    padding: 2,
  },
  reportIcon: {
    fontSize: 14,
    color: '#EF4444',
  },
  systemRow: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  systemBubble: {
    maxWidth: '92%',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  systemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  systemContent: {
    fontSize: 14,
    lineHeight: 21,
    color: '#1E293B',
  },
  systemTimestamp: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'right',
  },
});
