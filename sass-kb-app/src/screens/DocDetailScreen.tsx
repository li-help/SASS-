import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { docApi } from '@/services/docService';
import { usePermission } from '@/hooks/usePermission';
import CommentList from '@/components/CommentList';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius, shadows } from '@/theme';

type Props = NativeStackScreenProps<any, 'DocDetail'>;

export default function DocDetailScreen({ route, navigation }: Props) {
  const { docId } = route.params as { docId: string };
  const [webViewHeight, setWebViewHeight] = useState(100);
  const webViewRef = useRef<WebView>(null);

  const { data: canEdit } = usePermission('doc', docId, 'write');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['doc', docId],
    queryFn: async () => {
      const res = await docApi.getById(docId);
      if (res.code !== 200) throw new Error(res.message);
      return res.data;
    },
  });

  const onWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) {
        setWebViewHeight(data.height + 20); // 加一点 padding
      }
    } catch {
      // ignore
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>加载文档...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>加载失败: {(error as Error)?.message || '未知错误'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.7}>
          <Ionicons name="refresh" size={16} color={colors.textInverse} />
          <Text style={styles.retryText}> 重试</Text>
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
    color: #1F1F1F;
    margin: 0;
  }
  h1 { font-size: 28px; margin: 16px 0 12px; color: #1E3A5F; }
  h2 { font-size: 22px; margin: 14px 0 10px; color: #1E3A5F; }
  h3 { font-size: 18px; margin: 12px 0 8px; }
  img { max-width: 100%; height: auto; border-radius: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  td, th { border: 1px solid #E8E8E8; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; color: #1E3A5F; }
  pre { background: #1e1e1e; color: #d4d4d4; padding: 16px; overflow-x: auto; border-radius: 8px; font-size: 14px; }
  code { background: #E8EFF5; padding: 2px 6px; border-radius: 4px; font-size: 14px; color: #1E3A5F; }
  blockquote { border-left: 3px solid #1E3A5F; padding-left: 16px; color: #595959; margin: 12px 0; }
  ul, ol { padding-left: 24px; }
  a { color: #1E3A5F; }
</style>
<script>
  window.onload = function() {
    var h = document.body.scrollHeight;
    window.ReactNativeWebView.postMessage(JSON.stringify({ height: h }));
  };
</script>
</head>
<body>${contentHtml}</body>
</html>`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{doc?.title || '文档详情'}</Text>
        {canEdit ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('DocEdit', { docId, spaceId: doc?.spaceId })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.readOnlyBadge}>
            <Ionicons name="eye-outline" size={12} color={colors.warning} />
            <Text style={styles.readOnlyText}> 只读</Text>
          </View>
        )}
      </View>

      {/* Version history link */}
      <TouchableOpacity
        style={styles.subHeader}
        onPress={() => navigation.navigate('VersionList', { docId })}
        activeOpacity={0.6}
      >
        <Ionicons name="time-outline" size={14} color={colors.primary} />
        <Text style={styles.versionLink}> 版本历史</Text>
      </TouchableOpacity>

      {/* Content */}
      <ScrollView style={styles.scrollContent}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={{ height: webViewHeight }}
          javaScriptEnabled
          scalesPageToFit
          scrollEnabled={false}
          onMessage={onWebViewMessage}
        />
        <View style={styles.divider} />
        <CommentList docId={docId} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCard },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
    color: colors.textPrimary,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bgInput,
  },
  versionLink: { fontSize: 13, color: colors.primary, fontWeight: '500' },
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  readOnlyText: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  scrollContent: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginTop: spacing.sm },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.xxl,
  },
  loadingText: { marginTop: spacing.md, color: colors.textTertiary, fontSize: 14 },
  errorText: {
    color: colors.error,
    fontSize: 15,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  retryText: { color: colors.textInverse, fontSize: 14, fontWeight: '600' },
});
