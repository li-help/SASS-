import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { fileApi } from '@/services/fileService';

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
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>加载失败: {(error as Error)?.message}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const file = data?.info;
  const url = data?.url;

  if (!url) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>无法预览此文件</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoBar}>
        <Text style={styles.fileName} numberOfLines={1}>{file?.originalName || '文件预览'}</Text>
      </View>
      <WebView source={{ uri: url }} style={styles.webview} javaScriptEnabled />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  infoBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0' },
  fileName: { fontSize: 15, fontWeight: '500', color: '#1f1f1f' },
  webview: { flex: 1 },
  errorText: { color: '#ff4d4f', fontSize: 16, marginBottom: 16 },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#1677ff', borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
