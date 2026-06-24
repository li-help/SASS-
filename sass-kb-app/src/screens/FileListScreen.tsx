import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileApi, type FileAsset } from '@/services/fileService';

// 需要安装: npx expo install expo-document-picker
let DocumentPicker: any = null;
try {
  DocumentPicker = require('expo-document-picker');
} catch {}

function formatSize(bytes: number): string {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileListScreen() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['files'],
    queryFn: async () => {
      const res = await fileApi.list({ page: 1, size: 50 });
      return res.data?.records || [];
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => fileApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  const handleUpload = async () => {
    if (!DocumentPicker) {
      Alert.alert('提示', '请先安装 expo-document-picker: npx expo install expo-document-picker');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const file = result.assets[0];
      setUploading(true);
      const res = await fileApi.upload({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
      if (res.code === 200) {
        Alert.alert('上传成功', `${file.name} 已上传`);
        queryClient.invalidateQueries({ queryKey: ['files'] });
      } else {
        Alert.alert('上传失败', res.message || '未知错误');
      }
    } catch (e: any) {
      Alert.alert('上传失败', e?.message || '请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file: FileAsset) => {
    try {
      const res = await fileApi.getDownloadUrl(file.id);
      const url = res.data;
      if (url) {
        Linking.openURL(url);
      } else {
        Alert.alert('提示', '无法获取下载链接');
      }
    } catch {
      Alert.alert('错误', '获取下载链接失败');
    }
  };

  const handleDelete = (file: FileAsset) => {
    Alert.alert('删除文件', `确定删除「${file.originalName}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: () => deleteMut.mutate(file.id),
      },
    ]);
  };

  const files: FileAsset[] = data || [];

  const renderItem = ({ item }: { item: FileAsset }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileInfo}>
        <Text style={styles.fileIcon}>📄</Text>
        <View style={styles.fileText}>
          <Text style={styles.fileName} numberOfLines={1}>{item.originalName}</Text>
          <Text style={styles.fileMeta}>
            {formatSize(item.fileSize)} · {item.mimeType?.split('/')[1]?.toUpperCase() || item.mimeType}
          </Text>
        </View>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
          <Text style={styles.downloadText}>下载</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Text style={styles.deleteBtn}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>文件管理</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadingBtn]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.uploadBtnText}>
            {uploading ? '上传中...' : '+ 上传'}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无文件，点击右上角上传</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e0e0e0',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1f1f1f' },
  uploadBtn: {
    backgroundColor: '#1677ff', borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  uploadingBtn: { opacity: 0.6 },
  uploadBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16 },
  fileItem: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  fileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fileIcon: { fontSize: 28, marginRight: 12 },
  fileText: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500', color: '#1f1f1f' },
  fileMeta: { fontSize: 12, color: '#8c8c8c', marginTop: 2 },
  fileActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  downloadBtn: {
    backgroundColor: '#e6f4ff', borderRadius: 6,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  downloadText: { color: '#1677ff', fontSize: 13, fontWeight: '500' },
  deleteBtn: { color: '#ff4d4f', fontSize: 13, paddingVertical: 6 },
  emptyText: { textAlign: 'center', color: '#8c8c8c', fontSize: 15, marginTop: 60 },
});
