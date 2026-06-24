import { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { docApi } from '@/services/docService';
import { usePermission } from '@/hooks/usePermission';
import CommentList from '@/components/CommentList';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'DocDetail'>;

const WEBVIEW_HEIGHT = 500;

export default function DocDetailScreen({ route, navigation }: Props) {
  const { docId } = route.params as { docId: string };
  const [showComments, setShowComments] = useState(false);

  const { data: canEdit } = usePermission('doc', docId, 'write');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['doc', docId],
    queryFn: async () => {
      const res = await docApi.getById(docId);
      if (res.code !== 200) throw new Error(res.message);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1677ff" />
        <Text style={styles.loadingText}>加载文档...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>加载失败: {(error as Error)?.message || '未知错误'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const doc = data;
  const contentHtml = doc?.contentHtml || '';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 16px;
    line-height: 1.8;
    font-size: 16px;
    color: #1f1f1f;
    margin: 0;
  }
  h1 { font-size: 28px; margin: 16px 0 12px; }
  h2 { font-size: 22px; margin: 14px 0 10px; }
  h3 { font-size: 18px; margin: 12px 0 8px; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  td, th { border: 1px solid #e0e0e0; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; overflow-x: auto; border-radius: 8px; font-size: 14px; }
  code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
  blockquote { border-left: 3px solid #e5e7eb; padding-left: 16px; color: #6b7280; margin: 12px 0; }
  ul, ol { padding-left: 24px; }
  a { color: #1677ff; }
</style>
</head>
<body>${contentHtml}</body>
</html>`;

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{doc?.title || '文档详情'}</Text>
        {canEdit ? (
          <TouchableOpacity onPress={() => navigation.navigate('DocEdit', { docId, spaceId: doc?.spaceId })}>
            <Text style={styles.editBtn}>编辑</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.readOnlyBadge}>
            <Text style={styles.readOnlyText}>只读</Text>
          </View>
        )}
      </View>

      {/* Sub header: version history link */}
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => navigation.navigate('VersionList', { docId })}>
          <Text style={styles.versionLink}>版本历史</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollContent}>
        <WebView
          source={{ html }}
          style={{ height: WEBVIEW_HEIGHT }}
          javaScriptEnabled
          scalesPageToFit
          scrollEnabled={false}
        />
        <View style={styles.divider} />
        {/* Tab switcher */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, !showComments && styles.tabActive]}
            onPress={() => setShowComments(false)}
          >
            <Text style={[styles.tabText, !showComments && styles.tabTextActive]}>评论</Text>
          </TouchableOpacity>
        </View>
        <CommentList docId={docId} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', backgroundColor: '#fff',
  },
  backBtn: { fontSize: 15, color: '#1677ff' },
  headerTitle: { fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8, color: '#1f1f1f' },
  editBtn: { fontSize: 15, color: '#1677ff', fontWeight: '600' },
  subHeader: {
    flexDirection: 'row', justifyContent: 'center',
    paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0', backgroundColor: '#fafafa',
  },
  versionLink: { fontSize: 14, color: '#1677ff' },
  readOnlyBadge: {
    backgroundColor: '#fff7e6', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  readOnlyText: { fontSize: 12, color: '#fa8c16', fontWeight: '600' },
  scrollContent: { flex: 1 },
  divider: { height: 1, backgroundColor: '#f0f0f0' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 8 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#1677ff' },
  tabText: { fontSize: 14, color: '#8c8c8c' },
  tabTextActive: { color: '#1677ff', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 12, color: '#8c8c8c', fontSize: 14 },
  errorText: { color: '#ff4d4f', fontSize: 16, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#1677ff', borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
