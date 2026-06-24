import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { docApi, type DocumentVersion } from '@/services/docService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'VersionList'>;

export default function VersionListScreen({ route, navigation }: Props) {
  const { docId } = route.params as { docId: string };
  const [previewContent, setPreviewContent] = useState<{
    versionNumber: number;
    html: string;
  } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['doc-versions', docId],
    queryFn: async () => {
      const res = await docApi.getVersions(docId);
      return res.data as DocumentVersion[];
    },
  });

  const versions = data || [];

  const handlePreview = async (versionNumber: number) => {
    try {
      const res = await docApi.getVersion(docId, versionNumber);
      if (res.data) {
        setPreviewContent({
          versionNumber,
          html: res.data.contentHtml || '<p>空内容</p>',
        });
      }
    } catch {
      // ignore
    }
  };

  const renderItem = ({ item, index }: { item: DocumentVersion; index: number }) => {
    const isLatest = index === 0;

    return (
      <TouchableOpacity
        style={styles.versionItem}
        onPress={() => handlePreview(item.versionNumber)}
      >
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
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>版本历史</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={versions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无历史版本</Text>
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
              <Text style={styles.closeBtn}>关闭</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              版本 v{previewContent?.versionNumber}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          {previewContent && (
            <WebView
              source={{
                html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,sans-serif;padding:16px;line-height:1.8;font-size:16px;color:#1f1f1f;}img{max-width:100%;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #e0e0e0;padding:8px;}pre{background:#f5f5f5;padding:12px;border-radius:6px;}</style></head><body>${previewContent.html}</body></html>`,
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  backBtn: { fontSize: 15, color: '#1677ff' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1f1f1f' },
  listContent: { padding: 16 },
  versionItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  versionInfo: { flex: 1 },
  versionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  versionLabel: { fontSize: 16, fontWeight: '600', color: '#1f1f1f' },
  latestBadge: {
    backgroundColor: '#e6f4ff', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  latestText: { fontSize: 10, color: '#1677ff', fontWeight: '600' },
  versionMeta: { fontSize: 13, color: '#8c8c8c' },
  arrow: { fontSize: 22, color: '#d9d9d9', marginLeft: 8 },
  emptyText: { textAlign: 'center', color: '#8c8c8c', fontSize: 15, marginTop: 60 },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0',
  },
  closeBtn: { fontSize: 16, color: '#1677ff' },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#1f1f1f' },
  webview: { flex: 1 },
});
