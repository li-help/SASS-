import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentApi, type CommentNode } from '@/services/commentApi';

interface Props {
  docId: string;
}

function flattenComments(comments: CommentNode[], depth = 0): Array<CommentNode & { _depth: number }> {
  const result: Array<CommentNode & { _depth: number }> = [];
  for (const c of comments) {
    result.push({ ...c, _depth: depth });
    if (c.children?.length) {
      result.push(...flattenComments(c.children, depth + 1));
    }
  }
  return result;
}

export default function CommentList({ docId }: Props) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['comments', docId],
    queryFn: async () => {
      const res = await commentApi.list(docId);
      return res.data as CommentNode[];
    },
    enabled: !!docId,
  });

  const createMut = useMutation({
    mutationFn: (body: { documentId: string; content: string; parentId?: string }) =>
      commentApi.create(body),
    onSuccess: () => {
      setNewComment('');
      setReplyContent('');
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => commentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', docId] });
    },
  });

  const comments = data || [];
  const flatList = flattenComments(comments);

  const renderItem = ({ item }: { item: CommentNode & { _depth: number } }) => (
    <View style={[styles.commentItem, { marginLeft: item._depth * 20 }]}>
      <View style={styles.commentHeader}>
        <Text style={styles.creatorName}>{item.creatorName}</Text>
        <Text style={styles.commentTime}>
          {item.createdAt?.substring(0, 16)}
        </Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity onPress={() => setReplyTo(replyTo === item.id ? null : item.id)}>
          <Text style={styles.replyBtn}>回复</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          Alert.alert('删除评论', '确定删除？', [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
          ]);
        }}>
          <Text style={styles.deleteBtn}>删除</Text>
        </TouchableOpacity>
      </View>
      {replyTo === item.id && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.input}
            value={replyContent}
            onChangeText={setReplyContent}
            placeholder="回复..."
            multiline
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => createMut.mutate({
              documentId: docId,
              content: replyContent,
              parentId: item.id,
            })}
          >
            <Text style={styles.sendText}>发送</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>评论</Text>
      {/* New comment input */}
      <View style={styles.newCommentRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="添加评论..."
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newComment.trim() && styles.disabledBtn]}
          onPress={() => createMut.mutate({ documentId: docId, content: newComment })}
          disabled={!newComment.trim()}
        >
          <Text style={styles.sendText}>发送</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={flatList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>暂无评论</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1f1f1f' },
  newCommentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8,
    padding: 10, fontSize: 14, backgroundColor: '#fafafa',
  },
  sendBtn: {
    backgroundColor: '#1677ff', borderRadius: 8,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  disabledBtn: { backgroundColor: '#a0c4ff' },
  sendText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  commentItem: {
    borderLeftWidth: 2, borderLeftColor: '#f0f0f0',
    paddingLeft: 12, marginBottom: 12,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  creatorName: { fontSize: 14, fontWeight: '600', color: '#1f1f1f' },
  commentTime: { fontSize: 12, color: '#8c8c8c' },
  commentContent: { fontSize: 14, color: '#4a4a4a', lineHeight: 20, marginBottom: 6 },
  commentActions: { flexDirection: 'row', gap: 16 },
  replyBtn: { fontSize: 13, color: '#1677ff' },
  deleteBtn: { fontSize: 13, color: '#ff4d4f' },
  replyInput: { marginTop: 8, flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  emptyText: { textAlign: 'center', color: '#8c8c8c', marginTop: 20, fontSize: 14 },
});
