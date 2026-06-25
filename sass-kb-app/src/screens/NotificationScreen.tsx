import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi, type Notification } from '@/services/notificationApi';
import { colors, spacing, radius } from '@/theme';

export default function NotificationScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationApi.list({ page: 1, size: 50 });
      return res.data?.records as Notification[];
    },
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const handlePress = (item: Notification) => {
    if (!item.isRead) markReadMut.mutate(item.id);
    if (item.targetType === 'doc' && item.targetId) {
      navigation.navigate('DocDetail', { docId: item.targetId });
    }
  };

  const notifications = data || [];

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => handlePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.dotRow}>
          {!item.isRead && <View style={styles.unreadDot} />}
          <Ionicons
            name="notifications-outline"
            size={18}
            color={item.isRead ? colors.textTertiary : colors.primary}
            style={{ marginRight: spacing.sm }}
          />
          <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        {item.content ? (
          <Text style={styles.contentText} numberOfLines={1}>{item.content}</Text>
        ) : null}
        <Text style={styles.time}>{item.createdAt?.substring(0, 16)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息中心</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={() => markAllMut.mutate()} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={16} color={colors.primary} />
            <Text style={styles.markAllText}> 全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>暂无通知</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markAllText: { fontSize: 14, color: colors.primary },
  item: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  itemUnread: { backgroundColor: colors.primaryLight },
  itemContent: { padding: spacing.lg },
  dotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: spacing.xs,
  },
  title: { fontSize: 15, color: colors.textSecondary, flex: 1 },
  titleUnread: { color: colors.textPrimary, fontWeight: '600' },
  contentText: { fontSize: 13, color: colors.textTertiary, marginTop: spacing.xs, marginLeft: 26 },
  time: { fontSize: 12, color: colors.border, marginTop: spacing.xs, marginLeft: 26 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { color: colors.textTertiary, marginTop: spacing.md, fontSize: 15 },
});
