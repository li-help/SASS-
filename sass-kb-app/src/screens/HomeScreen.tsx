import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/authStore';
import { spaceApi, type Space } from '@/services/docService';
import { notificationApi } from '@/services/notificationApi';

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
      {/* 欢迎区 */}
      <View style={styles.welcomeCard}>
        <Text style={styles.greeting}>你好，{realName || '用户'}</Text>
        <Text style={styles.subtitle}>欢迎使用 SASS 知识平台</Text>
      </View>

      {/* 快速统计 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{spaces.length}</Text>
          <Text style={styles.statLabel}>知识空间</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{typeof unreadCount === 'number' ? unreadCount : '-'}</Text>
          <Text style={styles.statLabel}>未读消息</Text>
        </View>
      </View>

      {/* 快捷入口 */}
      <Text style={styles.sectionTitle}>知识空间</Text>
      {spacesLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color="#1677ff" />
      ) : spaces.length > 0 ? (
        spaces.slice(0, 5).map((space) => (
          <TouchableOpacity
            key={space.id}
            style={styles.spaceItem}
            onPress={() => {
              navigation.navigate('Spaces', {
                screen: 'SpaceList',
              });
            }}
          >
            <Text style={styles.spaceIcon}>📚</Text>
            <View style={styles.spaceInfo}>
              <Text style={styles.spaceName} numberOfLines={1}>{space.name}</Text>
              <Text style={styles.spaceDesc} numberOfLines={1}>{space.description || '暂无描述'}</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>暂无知识空间</Text>
        </View>
      )}

      {/* 快捷操作 */}
      <Text style={styles.sectionTitle}>快捷操作</Text>
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Spaces')}
        >
          <Text style={styles.actionIcon}>📄</Text>
          <Text style={styles.actionLabel}>浏览文档</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Search')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionLabel}>搜索知识</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Text style={styles.actionIcon}>🔔</Text>
          <Text style={styles.actionLabel}>消息中心</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 32 },
  welcomeCard: {
    backgroundColor: '#1677ff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#1677ff' },
  statLabel: { fontSize: 13, color: '#8c8c8c', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1f1f1f', marginBottom: 12, marginTop: 8 },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  spaceIcon: { fontSize: 24, marginRight: 12 },
  spaceInfo: { flex: 1 },
  spaceName: { fontSize: 15, fontWeight: '500', color: '#1f1f1f' },
  spaceDesc: { fontSize: 13, color: '#8c8c8c', marginTop: 2 },
  arrow: { fontSize: 22, color: '#d9d9d9', marginLeft: 8 },
  emptyBox: { backgroundColor: '#fff', borderRadius: 10, padding: 32, alignItems: 'center' },
  emptyText: { color: '#8c8c8c', fontSize: 14 },
  quickActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 13, color: '#4a4a4a', fontWeight: '500' },
});
