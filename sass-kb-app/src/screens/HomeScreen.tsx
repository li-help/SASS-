import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { spaceApi, type Space } from '@/services/docService';
import { notificationApi } from '@/services/notificationApi';
import { colors, spacing, radius, shadows } from '@/theme';

type Nav = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const { realName } = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: spacesData, isLoading: spacesLoading } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => spaceApi.list(),
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data?.count ?? 0;
    },
  });

  const spaces: Space[] = spacesData?.data || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 欢迎卡片 */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeContent}>
          <Text style={styles.greeting}>你好，{realName || '用户'}</Text>
          <Text style={styles.subtitle}>欢迎使用 SASS 知识平台</Text>
        </View>
        <View style={styles.welcomeIcon}>
          <Ionicons name="library" size={40} color="rgba(255,255,255,0.3)" />
        </View>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="folder-open" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.statNumber}>{spaces.length}</Text>
            <Text style={styles.statLabel}>知识空间</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: colors.errorLight }]}>
            <Ionicons name="notifications" size={22} color={colors.error} />
          </View>
          <View>
            <Text style={styles.statNumber}>{typeof unreadCount === 'number' ? unreadCount : '-'}</Text>
            <Text style={styles.statLabel}>未读消息</Text>
          </View>
        </View>
      </View>

      {/* 知识空间列表 */}
      <Text style={styles.sectionTitle}>知识空间</Text>
      {spacesLoading ? (
        <ActivityIndicator style={{ marginTop: spacing.xl }} color={colors.primary} />
      ) : spaces.length > 0 ? (
        spaces.slice(0, 5).map((space) => (
          <TouchableOpacity
            key={space.id}
            style={styles.spaceItem}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Spaces', { screen: 'SpaceList' })}
          >
            <View style={styles.spaceIconBg}>
              <Ionicons name="folder-open" size={20} color={colors.primary} />
            </View>
            <View style={styles.spaceInfo}>
              <Text style={styles.spaceName} numberOfLines={1}>{space.name}</Text>
              <Text style={styles.spaceDesc} numberOfLines={1}>{space.description || '暂无描述'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyBox}>
          <Ionicons name="folder-open-outline" size={40} color={colors.border} />
          <Text style={styles.emptyText}>暂无知识空间</Text>
        </View>
      )}

      {/* 快捷操作 */}
      <Text style={styles.sectionTitle}>快捷操作</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Spaces')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="document-text" size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionLabel}>浏览文档</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Search')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.successLight }]}>
            <Ionicons name="search" size={24} color={colors.success} />
          </View>
          <Text style={styles.actionLabel}>搜索知识</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('Notifications')}
        >
          <View style={[styles.actionIconBg, { backgroundColor: colors.warningLight }]}>
            <Ionicons name="notifications" size={24} color={colors.warning} />
          </View>
          <Text style={styles.actionLabel}>消息中心</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  welcomeContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  welcomeIcon: {
    marginLeft: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  spaceIconBg: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  spaceInfo: { flex: 1 },
  spaceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  spaceDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  emptyBox: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
