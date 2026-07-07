import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { docApi, type DocumentVersion } from '@/services/docService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius, shadows } from '@/theme';

type Props = NativeStackScreenProps<any, 'VersionList'>;

export default function VersionListScreen({ route, navigation }: Props) {
  const { docId } = route.params as { docId: string };
  const queryClient = useQueryClient();
  const [previewContent, setPreviewContent] = useState<{
    versionNumber: number;
    contentHtml: string;
    contentJson: string;
    title: string;
  } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doc-versions', docId],
    queryFn: async () => {
      const res = await docApi.getVersions(docId);
      return res.data as DocumentVersion[];
    },
  });

  // 获取当前文档信息用于恢复
  const { data: currentDoc } = useQuery({
    queryKey: ['doc', docId],
    queryFn: async () => {
      const res = await docApi.getById(docId);
      return res.data;
    },
    enabled: false, // 仅在恢复时手动触发
  });

  const restoreMut = useMutation({
    mutationFn: async () => {
      if (!previewContent) return;
      // 获取当前文档以拿到最新 version
      const docRes = await docApi.getById(docId);
      if (docRes.code !== 200) throw new Error('获取文档失败');
      const doc = docRes.data;
      return docApi.save(docId, {
        title: previewContent.title,
        contentJson: previewContent.contentJson,
        contentHtml: previewContent.contentHtml,
        version: doc.version,
      });
    },
    onSuccess: () => {
      Alert.alert('成功', `已恢复到版本 v${previewContent?.versionNumber}`);
      setPreviewContent(null);
      queryClient.invalidateQueries({ queryKey: ['doc', docId] });
      queryClient.invalidateQueries({ queryKey: ['doc-versions', docId] });
    },
    onError: (e: any) => {
      if (e?.response?.status === 409) {
        Alert.alert('冲突', '文档已被他人修改，请刷新后重试');
      } else {
        Alert.alert('错误', '恢复版本失败');
      }
    },
  });

  const versions = data || [];

  const handlePreview = async (versionNumber: number) => {
    try {
      const res = await docApi.getVersion(docId, versionNumber);
      if (res.data) {
        setPreviewContent({
          versionNumber,
          contentHtml: res.data.contentHtml || '<p>空内容</p>',
          contentJson: res.data.contentJson || '',
          title: currentDoc?.title || '',
        });
      }
    } catch {
      // ignore
    }
  };

  const handleRestore = () => {
    Alert.alert(
      '恢复版本',
      `确定恢复到版本 v${previewContent?.versionNumber}？当前内容将被覆盖。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '恢复',
          style: 'destructive',
          onPress: () => restoreMut.mutate(),
        },
      ]
    );
  };

  const renderItem = ({ item, index }: { item: DocumentVersion; index: number }) => {
    const isLatest = index === 0;

    return (
      <TouchableOpacity
        style={styles.versionItem}
        activeOpacity={0.7}
        onPress={() => handlePreview(item.versionNumber)}
      >
        <View style={styles.versionIcon}>
          <Ionicons name="git-branch-outline" size={20} color={isLatest ? colors.primary : colors.textTertiary} />
        </View>
        <View style={styles.versionInfo}>
          <View style={styles.versionHeader}>
            <Text style={styles.versionLabel}>v{item.versionNumber}</Text>
            {isLatest && (
              <View style={styles.latestBadge}>
                <Text style={styles.latestText}>最新</Text>
              </View>
            )}
          </View>
          <Text style={styles.versionMeta} numberOfLines={1}>
            {item.changeSummary || (item.createdAt ? `保存于 ${item.createdAt.substring(0, 16)}` : '')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>版本历史</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={versions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>暂无历史版本</Text>
            </View>
          }
        />
      )}

      {/* Preview Modal */}
      <Modal
        visible={!!previewContent}
        animationType="slide"
        onRequestClose={() => setPreviewContent(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPreviewContent(null)}>
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              版本 v{previewContent?.versionNumber}
            </Text>
            <TouchableOpacity
              onPress={handleRestore}
              disabled={restoreMut.isPending}
              style={styles.restoreBtn}
            >
              <Ionicons name="refresh" size={18} color={colors.textInverse} />
              <Text style={styles.restoreBtnText}> {restoreMut.isPending ? '恢复中...' : '恢复'}</Text>
            </TouchableOpacity>
          </View>
          {previewContent && (
            <WebView
              source={{
                html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,sans-serif;padding:16px;line-height:1.8;font-size:16px;color:#1F1F1F;}h1,h2,h3{color:#1E3A5F;}img{max-width:100%;border-radius:6px;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #E8E8E8;padding:8px;}pre{background:#F0F2F5;padding:12px;border-radius:6px;}a{color:#1E3A5F;}</style></head><body>${previewContent.contentHtml}</body></html>`,
              }}
              style={styles.webview}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  versionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  versionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  versionInfo: { flex: 1 },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  versionLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  latestBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  latestText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
  versionMeta: { fontSize: 13, color: colors.textTertiary },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { color: colors.textTertiary, fontSize: 15, marginTop: spacing.md },
  modalContainer: { flex: 1, backgroundColor: colors.bgCard },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  restoreBtnText: { color: colors.textInverse, fontSize: 13, fontWeight: '600' },
  webview: { flex: 1 },
});
