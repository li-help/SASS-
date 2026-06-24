import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { docApi } from '@/services/docService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

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
    onError: () => {
      Alert.alert('错误', '创建失败，请检查网络');
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtn}>取消</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>新建文档</Text>
        <TouchableOpacity
          onPress={() => createMut.mutate()}
          disabled={!title.trim() || createMut.isPending}
        >
          <Text style={[styles.createBtn, !title.trim() && styles.disabledBtn]}>
            {createMut.isPending ? '创建中...' : '创建'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.label}>文档标题</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="输入文档标题"
          placeholderTextColor="#999"
          autoFocus
          maxLength={200}
        />
        {createMut.isPending && (
          <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 24 }} />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  cancelBtn: { fontSize: 16, color: '#8c8c8c' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1f1f1f' },
  createBtn: { fontSize: 16, color: '#1677ff', fontWeight: '600' },
  disabledBtn: { opacity: 0.4 },
  body: { padding: 20 },
  label: { fontSize: 15, fontWeight: '500', color: '#1f1f1f', marginBottom: 10 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
});
