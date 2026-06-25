import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fileApi, type FileAsset } from '@/services/fileService';
import { colors, spacing, radius, shadows } from '@/theme';

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

function getFileIcon(mimeType: string): keyof typeof Ionicons.glyphMap {
  if (!mimeType) return 'document-outline';
  if (mimeType.startsWith('image/')) return 'image-outline';
  if (mimeType.startsWith('video/')) return 'videocam-outline';
  if (mimeType.startsWith('audio/')) return 'musical-notes-outline';
  if (mimeType.includes('pdf')) return 'document-text-outline';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive-outline';
  return 'document-outline';
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
      { text: '删除', style: 'destructive', onPress: () => deleteMut.mutate(file.id) },
    ]);
  };

  const files: FileAsset[] = data || [];

  const renderItem = ({ item }: { item: FileAsset }) => (
    <View style={styles.fileItem}>
      <View style={styles.fileInfo}>
        <View style={styles.fileIconBg}>
          <Ionicons name={getFileIcon(item.mimeType)} size={22} color={colors.primary} />
        </View>
        <View style={styles.fileText}>
          <Text style={styles.fileName} numberOfLines={1}>{item.originalName}</Text>
          <Text style={styles.fileMeta}>
            {formatSize(item.fileSize)} · {item.mimeType?.split('/')[1]?.toUpperCase() || item.mimeType}
          </Text>
        </View>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)} activeOpacity={0.7}>
          <Ionicons name="download-outline" size={14} color={colors.primary} />
          <Text style={styles.downloadText}> 下载</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>文件管理</Text>
        <TouchableOpacity
          style={[styles.uploadBtn, uploading && styles.uploadingBtn]}
          onPress={handleUpload}
          disabled={uploading}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={16} color={colors.textInverse} />
          <Text style={styles.uploadBtnText}> {uploading ? '上传中...' : '上传'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={files}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>暂无文件，点击右上角上传</Text>
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
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  uploadingBtn: { opacity: 0.6 },
  uploadBtnText: { color: colors.textInverse, fontSize: 14, fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  fileItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fileIconBg: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  fileText: { flex: 1 },
  fileName: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  fileMeta: { fontSize: 12, color: colors.textTertiary, marginTop: 2 },
  fileActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.lg,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  downloadText: { color: colors.primary, fontSize: 13, fontWeight: '500' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { color: colors.textTertiary, fontSize: 15, marginTop: spacing.md, textAlign: 'center' },
});
