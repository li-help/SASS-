import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { notificationApi, type Notification } from '@/services/notificationApi';

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
    if (!item.isRead) {
      markReadMut.mutate(item.id);
    }
    if (item.targetType === 'doc' && item.targetId) {
      navigation.navigate('DocDetail', { docId: item.targetId });
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => handlePress(item)}
    >
      <View style={styles.dotRow}>
        {!item.isRead && <View style={styles.unreadDot} />}
        <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      {item.content ? (
        <Text style={styles.content} numberOfLines={1}>{item.content}</Text>
      ) : null}
      <Text style={styles.time}>{item.createdAt?.substring(0, 16)}</Text>
    </TouchableOpacity>
  );

  const notifications = data || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息中心</Text>
        {notifications.some(n => !n.isRead) && (
          <TouchableOpacity onPress={() => markAllMut.mutate()}>
            <Text style={styles.markAllBtn}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无通知</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f1f1f' },
  markAllBtn: { fontSize: 14, color: '#1677ff' },
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  itemUnread: { backgroundColor: '#f0f5ff' },
  dotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1677ff', flexShrink: 0 },
  title: { fontSize: 15, color: '#4a4a4a', flex: 1 },
  titleUnread: { color: '#1f1f1f', fontWeight: '600' },
  content: { fontSize: 13, color: '#8c8c8c', marginTop: 4 },
  time: { fontSize: 12, color: '#bfbfbf', marginTop: 4 },
  emptyText: { textAlign: 'center', color: '#8c8c8c', marginTop: 60, fontSize: 15 },
});
