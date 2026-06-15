import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Profile } from '../../../packages/shared/src/auth/types';
import { ADMIN_BRAND } from '../constants';

interface Props {
  user: Profile;
}

const ROLE_COLORS: Record<string, string> = {
  admin: ADMIN_BRAND.accent,
  owner: '#047857',
  dispatcher: '#B45309',
  driver: '#64748B',
  accountant: '#7C3AED',
};

export const CompanyUserRow: React.FC<Props> = ({ user }) => {
  const roleColor = ROLE_COLORS[user.role] ?? ADMIN_BRAND.textSecondary;

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(user.full_name ?? 'U').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.full_name ?? 'Unnamed User'}</Text>
        <Text style={styles.meta}>{user.phone ?? 'No phone on file'}</Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: `${roleColor}18` }]}>
        <Text style={[styles.roleText, { color: roleColor }]}>{user.role}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ADMIN_BRAND.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: ADMIN_BRAND.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_BRAND.accent,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_BRAND.textPrimary,
  },
  meta: {
    fontSize: 12,
    color: ADMIN_BRAND.textSecondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});