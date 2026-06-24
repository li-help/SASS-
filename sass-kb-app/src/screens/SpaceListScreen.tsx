import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { spaceApi, folderApi, docApi } from '@/services/docService';
import type { Space, SpaceTreeNode, Document } from '@/services/docService';

type Nav = NativeStackNavigationProp<any>;

export default function SpaceListScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [contextTarget, setContextTarget] = useState<{ id: string; type: 'space' | 'folder' } | null>(null);

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
      // 切换选中的文件夹用于新建子文件夹
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
      style={[styles.treeItem, { paddingLeft: 16 + depth * 20 }]}
      onPress={() => handleDocPress(item)}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
    >
      <Text style={[styles.treeIcon, item.type === 'folder' && styles.folderIcon]}>
        {item.type === 'folder' ? '📁' : '📄'}
      </Text>
      <Text
        style={[styles.treeName, item.type === 'folder' && styles.folderName]}
        numberOfLines={1}
      >
        {item.name}
      </Text>
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
          <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={spaces}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={spacesLoading} onRefresh={refetchSpaces} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.spaceCard}
                onPress={() => setSelectedSpace(item.id)}
              >
                <Text style={styles.spaceIcon}>📚</Text>
                <View style={styles.spaceInfo}>
                  <Text style={styles.spaceName}>{item.name}</Text>
                  <Text style={styles.spaceDesc} numberOfLines={2}>
                    {item.description || '暂无描述'}
                  </Text>
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>暂无知识空间</Text>
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
        <TouchableOpacity onPress={() => setSelectedSpace(null)}>
          <Text style={styles.breadcrumbLink}>← 空间列表</Text>
        </TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleCreateDoc(selectedSpace!)}
          >
            <Text style={styles.actionBtnText}>+ 文档</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => { setSelectedFolderId(null); setFolderModalOpen(true); }}
          >
            <Text style={styles.actionBtnText}>+ 文件夹</Text>
          </TouchableOpacity>
        </View>
      </View>
      {treeLoading ? (
        <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tree}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={treeLoading} onRefresh={refetchTree} />}
          renderItem={({ item }) => (
            <View>{renderTree([item])}</View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>该空间暂无内容</Text>
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
              placeholderTextColor="#999"
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 16 },
  spaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  spaceIcon: { fontSize: 32, marginRight: 12 },
  spaceInfo: { flex: 1 },
  spaceName: { fontSize: 16, fontWeight: '600', color: '#1f1f1f' },
  spaceDesc: { fontSize: 13, color: '#8c8c8c', marginTop: 4 },
  arrow: { fontSize: 24, color: '#d9d9d9', marginLeft: 8 },
  breadcrumb: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breadcrumbLink: { fontSize: 15, color: '#1677ff', fontWeight: '500' },
  treeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingRight: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  treeIcon: { fontSize: 18, marginRight: 10 },
  folderIcon: { opacity: 0.8 },
  treeName: { flex: 1, fontSize: 15, color: '#1f1f1f' },
  folderName: { fontWeight: '500' },
  emptyText: {
    textAlign: 'center',
    color: '#8c8c8c',
    fontSize: 15,
    marginTop: 60,
  },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#1677ff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1f1f1f', marginBottom: 16 },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalCancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalCancelText: { fontSize: 15, color: '#666' },
  modalConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1677ff',
  },
  modalConfirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  disabledBtn: { opacity: 0.4 },
});
