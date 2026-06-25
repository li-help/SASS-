import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { spaceApi, folderApi, docApi } from '@/services/docService';
import type { Space, SpaceTreeNode, Document } from '@/services/docService';
import { colors, spacing, radius, shadows } from '@/theme';

type Nav = NativeStackNavigationProp<any>;

export default function SpaceListScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const { data: spacesData, isLoading: spacesLoading, refetch: refetchSpaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: () => spaceApi.list(),
  });

  const { data: treeData, isLoading: treeLoading, refetch: refetchTree } = useQuery({
    queryKey: ['space-tree', selectedSpace],
    queryFn: () => spaceApi.getTree(selectedSpace!),
    enabled: !!selectedSpace,
  });

  useFocusEffect(
    useCallback(() => {
      refetchSpaces();
    }, [refetchSpaces])
  );

  const createFolderMut = useMutation({
    mutationFn: (name: string) =>
      folderApi.create({
        spaceId: selectedSpace!,
        parentId: selectedFolderId || '',
        name,
      }),
    onSuccess: () => {
      setFolderModalOpen(false);
      setNewFolderName('');
      queryClient.invalidateQueries({ queryKey: ['space-tree', selectedSpace] });
      Alert.alert('成功', '文件夹已创建');
    },
    onError: () => Alert.alert('错误', '创建文件夹失败'),
  });

  const handleCreateDoc = (spaceId: string, folderId?: string) => {
    navigation.navigate('DocCreate', { spaceId, folderId });
  };

  const spaces: Space[] = spacesData?.data || [];
  const tree: SpaceTreeNode[] = treeData?.data || [];

  const handleDocPress = (node: SpaceTreeNode) => {
    if (node.type === 'doc') {
      navigation.navigate('DocDetail', { docId: node.id });
    } else if (node.type === 'folder') {
      setSelectedFolderId(node.id === selectedFolderId ? null : node.id);
    }
  };

  const handleLongPress = (node: SpaceTreeNode) => {
    if (node.type === 'folder') {
      Alert.alert(node.name, '选择操作', [
        { text: '在此新建文档', onPress: () => handleCreateDoc(selectedSpace!, node.id) },
        { text: '新建子文件夹', onPress: () => {
          setSelectedFolderId(node.id);
          setFolderModalOpen(true);
        }},
        { text: '取消', style: 'cancel' },
      ]);
    }
  };

  const renderTreeItem = (item: SpaceTreeNode, depth: number = 0) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.treeItem, { paddingLeft: spacing.lg + depth * 20 }]}
      onPress={() => handleDocPress(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
      activeOpacity={0.6}
    >
      <Ionicons
        name={item.type === 'folder' ? 'folder' : 'document-text'}
        size={20}
        color={item.type === 'folder' ? colors.warning : colors.primary}
        style={{ marginRight: spacing.sm + 2 }}
      />
      <Text
        style={[styles.treeName, item.type === 'folder' && styles.folderName]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </TouchableOpacity>
  );

  const renderTree = (nodes: SpaceTreeNode[], depth: number = 0) => {
    const result: React.ReactNode[] = [];
    for (const node of nodes) {
      result.push(renderTreeItem(node, depth));
      if (node.children && node.children.length > 0) {
        result.push(...renderTree(node.children, depth + 1));
      }
    }
    return result;
  };

  if (!selectedSpace) {
    return (
      <View style={styles.container}>
        {spacesLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={spaces}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={spacesLoading}
                onRefresh={refetchSpaces}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.spaceCard}
                activeOpacity={0.7}
                onPress={() => setSelectedSpace(item.id)}
              >
                <View style={styles.spaceIconBg}>
                  <Ionicons name="folder-open" size={28} color={colors.primary} />
                </View>
                <View style={styles.spaceInfo}>
                  <Text style={styles.spaceName}>{item.name}</Text>
                  <Text style={styles.spaceDesc} numberOfLines={2}>
                    {item.description || '暂无描述'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.border} />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="folder-open-outline" size={48} color={colors.border} />
                <Text style={styles.emptyText}>暂无知识空间</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => setSelectedSpace(null)} style={styles.breadcrumbBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={styles.breadcrumbLink}> 空间列表</Text>
        </TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.7}
            onPress={() => handleCreateDoc(selectedSpace!)}
          >
            <Ionicons name="add" size={16} color={colors.textInverse} />
            <Text style={styles.actionBtnText}> 文档</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            activeOpacity={0.7}
            onPress={() => { setSelectedFolderId(null); setFolderModalOpen(true); }}
          >
            <Ionicons name="folder-open" size={16} color={colors.primary} />
            <Text style={styles.actionBtnTextSecondary}> 文件夹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {treeLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tree}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={treeLoading}
              onRefresh={refetchTree}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.treeList}>{renderTree([item])}</View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>该空间暂无内容</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* 新建文件夹 Modal */}
      <Modal
        visible={folderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFolderModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {selectedFolderId ? '新建子文件夹' : '新建文件夹'}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={newFolderName}
              onChangeText={setNewFolderName}
              placeholder="输入文件夹名称"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => { setFolderModalOpen(false); setNewFolderName(''); }}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, !newFolderName.trim() && styles.disabledBtn]}
                onPress={() => createFolderMut.mutate(newFolderName)}
                disabled={!newFolderName.trim() || createFolderMut.isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.modalConfirmText}>
                  {createFolderMut.isPending ? '创建中...' : '创建'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  spaceIconBg: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  spaceInfo: { flex: 1 },
  spaceName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  spaceDesc: { fontSize: 13, color: colors.textTertiary, marginTop: spacing.xs },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  breadcrumbBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breadcrumbLink: { fontSize: 15, color: colors.primary, fontWeight: '500' },
  treeList: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.sm,
  },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  treeName: { flex: 1, fontSize: 15, color: colors.textPrimary },
  folderName: { fontWeight: '600' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 15,
    marginTop: spacing.md,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  actionBtnSecondary: {
    backgroundColor: colors.primaryLight,
  },
  actionBtnText: {
    color: colors.textInverse,
    fontSize: 13,
    fontWeight: '600',
  },
  actionBtnTextSecondary: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  modalBox: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    backgroundColor: colors.bgInput,
    marginBottom: spacing.xl,
    color: colors.textPrimary,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm + 2 },
  modalCancelBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: { fontSize: 15, color: colors.textSecondary },
  modalConfirmBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  modalConfirmText: { fontSize: 15, color: colors.textInverse, fontWeight: '600' },
  disabledBtn: { opacity: 0.4 },
});
