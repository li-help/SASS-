import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius, shadows } from '@/theme';

export default function ProfileScreen() {
  const { realName, userId, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    {
      icon: 'person-circle-outline' as const,
      label: '账号信息',
      onPress: () => Alert.alert('账号信息', `用户名：${realName || '未设置'}\n用户ID：${userId || '-'}`),
    },
    {
      icon: 'lock-closed-outline' as const,
      label: '修改密码',
      onPress: () => Alert.alert('修改密码', '请联系管理员修改密码'),
    },
    {
      icon: 'information-circle-outline' as const,
      label: '关于',
      onPress: () => Alert.alert('关于 SASS 知识平台', '版本 1.0.0\n基于 Expo + React Native 构建\n支持 Web / iOS / Android'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* 用户头像 */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {realName ? realName.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{realName || '未设置姓名'}</Text>
        <Text style={styles.userId}>ID: {userId || '-'}</Text>
      </View>

      {/* 功能菜单 */}
      <View style={styles.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            activeOpacity={0.6}
            onPress={item.onPress}
          >
            <View style={styles.menuLeft}>
              <Ionicons name={item.icon} size={22} color={colors.primary} style={{ marginRight: spacing.md }} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>
        ))}
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} style={{ marginRight: spacing.sm }} />
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
    alignItems: 'center',
    paddingTop: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userId: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  menuSection: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.xxl,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  logoutBtn: {
    flexDirection: 'row',
    width: '80%',
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  logoutText: {
    fontSize: 16,
    color: colors.error,
    fontWeight: '500',
  },
});
