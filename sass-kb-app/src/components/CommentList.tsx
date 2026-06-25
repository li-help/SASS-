import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { commentApi, type CommentNode } from '@/services/commentApi';
import { colors, spacing, radius } from '@/theme';

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
        <View style={styles.creatorAvatar}>
          <Ionicons name="person" size={14} color={colors.textInverse} />
        </View>
        <Text style={styles.creatorName}>{item.creatorName}</Text>
        <Text style={styles.commentTime}>{item.createdAt?.substring(0, 16)}</Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity
          onPress={() => setReplyTo(replyTo === item.id ? null : item.id)}
          style={styles.actionBtn}
        >
          <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
          <Text style={styles.replyBtn}> 回复</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('删除评论', '确定删除？', [
              { text: '取消', style: 'cancel' },
              { text: '删除', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
            ]);
          }}
          style={styles.actionBtn}
        >
          <Ionicons name="trash-outline" size={14} color={colors.error} />
          <Text style={styles.deleteBtn}> 删除</Text>
        </TouchableOpacity>
      </View>
      {replyTo === item.id && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.input}
            value={replyContent}
            onChangeText={setReplyContent}
            placeholder="回复..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !replyContent.trim() && styles.disabledBtn]}
            onPress={() => createMut.mutate({
              documentId: docId,
              content: replyContent,
              parentId: item.id,
            })}
            disabled={!replyContent.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={14} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>评论</Text>
      <View style={styles.newCommentRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="添加评论..."
          placeholderTextColor={colors.textTertiary}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newComment.trim() && styles.disabledBtn]}
          onPress={() => createMut.mutate({ documentId: docId, content: newComment })}
          disabled={!newComment.trim()}
          activeOpacity={0.7}
        >
          <Ionicons name="send" size={16} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
      ) : (
        <FlatList
          data={flatList}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={32} color={colors.border} />
              <Text style={styles.emptyText}>暂无评论</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  newCommentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    fontSize: 14,
    backgroundColor: colors.bgInput,
    color: colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: colors.primaryLight },
  commentItem: {
    borderLeftWidth: 2,
    borderLeftColor: colors.primaryLight,
    paddingLeft: spacing.md,
    marginBottom: spacing.md,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  commentTime: { fontSize: 12, color: colors.textTertiary },
  commentContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  commentActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBtn: { fontSize: 13, color: colors.primary },
  deleteBtn: { fontSize: 13, color: colors.error },
  replyInput: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.textTertiary,
    marginTop: spacing.sm,
    fontSize: 14,
  },
});
