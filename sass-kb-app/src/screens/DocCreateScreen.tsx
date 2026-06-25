import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { docApi } from '@/services/docService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius, shadows } from '@/theme';

type Props = NativeStackScreenProps<any, 'DocCreate'>;

export default function DocCreateScreen({ route, navigation }: Props) {
  const { spaceId, folderId } = route.params as { spaceId: string; folderId?: string };
  const [title, setTitle] = useState('');

  const createMut = useMutation({
    mutationFn: () =>
      docApi.create({ spaceId, folderId: folderId || '', title }),
    onSuccess: (res: any) => {
      if (res.code === 200 && res.data) {
        Alert.alert('创建成功', '是否立即编辑文档？', [
          { text: '稍后', style: 'cancel', onPress: () => navigation.goBack() },
          {
            text: '编辑',
            onPress: () => {
              navigation.navigate('DocEdit', { docId: res.data.id });
            },
          },
        ]);
      } else {
        Alert.alert('错误', res.message || '创建失败');
      }
    },
    onError: () => Alert.alert('错误', '创建失败，请检查网络'),
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新建文档</Text>
        <TouchableOpacity
          onPress={() => createMut.mutate()}
          disabled={!title.trim() || createMut.isPending}
          style={[styles.createBtn, !title.trim() && styles.disabledBtn]}
        >
          <Text style={[styles.createBtnText, !title.trim() && styles.disabledText]}>
            {createMut.isPending ? '创建中...' : '创建'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>文档标题</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="document-text-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="输入文档标题"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            maxLength={200}
          />
        </View>
        {createMut.isPending && (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: spacing.xl }} />
        )}
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  createBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  createBtnText: { fontSize: 15, color: colors.textInverse, fontWeight: '600' },
  disabledBtn: { backgroundColor: colors.primaryLight },
  disabledText: { color: colors.primary, fontWeight: '400' },
  body: { padding: spacing.xl },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bgInput,
  },
  inputIcon: {
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
