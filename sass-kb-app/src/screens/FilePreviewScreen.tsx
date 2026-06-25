import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { fileApi } from '@/services/fileService';
import { colors, spacing, radius } from '@/theme';

type Props = NativeStackScreenProps<any, 'FilePreview'>;

export default function FilePreviewScreen({ route }: Props) {
  const { fileId } = route.params as { fileId: string };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['file', fileId],
    queryFn: async () => {
      const infoRes = await fileApi.getById(fileId);
      if (infoRes.code !== 200) throw new Error(infoRes.message);
      const downloadRes = await fileApi.getDownloadUrl(fileId);
      if (downloadRes.code !== 200) throw new Error(downloadRes.message);
      return { info: infoRes.data, url: downloadRes.data };
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>加载失败: {(error as Error)?.message}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()} activeOpacity={0.7}>
          <Ionicons name="refresh" size={16} color={colors.textInverse} />
          <Text style={styles.retryText}> 重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const file = data?.info;
  const url = data?.url;

  if (!url) {
    return (
      <View style={styles.center}>
        <Ionicons name="eye-off-outline" size={48} color={colors.border} />
        <Text style={styles.errorText}>无法预览此文件</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoBar}>
        <Ionicons name="document-outline" size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
        <Text style={styles.fileName} numberOfLines={1}>{file?.originalName || '文件预览'}</Text>
      </View>
      <WebView source={{ uri: url }} style={styles.webview} javaScriptEnabled />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCard },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.xxl,
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  fileName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary, flex: 1 },
  webview: { flex: 1 },
  errorText: { color: colors.error, fontSize: 15, marginTop: spacing.md, marginBottom: spacing.lg },
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
