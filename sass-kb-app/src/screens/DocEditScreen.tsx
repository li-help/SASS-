import { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { docApi } from '@/services/docService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius } from '@/theme';

type Props = NativeStackScreenProps<any, 'DocEdit'>;

/** 简易 HTML 清洗 — 移除 script 标签、事件处理器和 javascript: 链接 */
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:');
}

export default function DocEditScreen({ route, navigation }: Props) {
  const { docId } = route.params as { docId: string };
  const webViewRef = useRef<WebView>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [version, setVersion] = useState(1);
  const [originalContentJson, setOriginalContentJson] = useState('');

  // Ref 保存最新值，避免 saveMut 中的陈旧闭包
  const latestRef = useRef({ title: '', contentHtml: '', contentJson: '', version: 1 });
  latestRef.current = { title, contentHtml, contentJson: originalContentJson, version };

  const { isLoading } = useQuery({
    queryKey: ['doc', docId],
    queryFn: async () => {
      const res = await docApi.getById(docId);
      if (res.code !== 200) throw new Error(res.message);
      const d = res.data;
      setTitle(d.title);
      setContentHtml(d.contentHtml || '');
      setVersion(d.version);
      setOriginalContentJson(d.contentJson || '');
      return d;
    },
  });

  const saveMut = useMutation({
    mutationFn: (html: string) => {
      const cur = latestRef.current;
      return docApi.save(docId, {
        title: cur.title,
        contentJson: cur.contentJson,
        contentHtml: html,
        version: cur.version,
      });
    },
    onSuccess: (res: any) => {
      if (res.code === 200) {
        // 保存成功后同步 contentJson（后端可能返回更新后的值）
        if (res.data) {
          if (res.data.version) setVersion(res.data.version);
          if (res.data.contentJson) setOriginalContentJson(res.data.contentJson);
          if (res.data.contentHtml) setContentHtml(res.data.contentHtml);
        }
        Alert.alert('提示', '保存成功');
      } else if (res.code === 409) {
        Alert.alert('冲突', '文档已被他人修改，请刷新后重试');
      } else {
        Alert.alert('错误', res.message || '保存失败');
      }
    },
    onError: () => Alert.alert('错误', '保存失败，请检查网络'),
  });

  const handleSave = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        var html = document.documentElement.outerHTML;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'save', html: html }));
      })();
      true;
    `);
  }, []);

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'save' && data.html) {
        const clean = sanitizeHtml(data.html);
        setContentHtml(clean);
        // 直接从 message 数据调用 save，确保使用最新 HTML
        saveMut.mutate(clean);
      }
    } catch {
      // ignore parse errors
    }
  }, [saveMut]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const editableHtml = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, sans-serif;
    padding: 16px;
    line-height: 1.8;
    font-size: 16px;
    color: #1F1F1F;
    margin: 0;
  }
  body:focus { outline: none; }
  h1, h2, h3 { color: #1E3A5F; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #E8E8E8; padding: 8px; }
  pre { background: #F0F2F5; padding: 12px; border-radius: 6px; }
  a { color: #1E3A5F; }
</style>
</head>
<body contenteditable="true">${contentHtml}</body>
</html>`;

  return (
    <View style={styles.container}>
      <View style={styles.titleBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="文档标题"
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity
          style={[styles.saveBtn, saveMut.isPending && styles.savingBtn]}
          onPress={handleSave}
          disabled={saveMut.isPending}
          activeOpacity={0.7}
        >
          <Ionicons name="save-outline" size={16} color={colors.textInverse} />
          <Text style={styles.saveBtnText}> {saveMut.isPending ? '保存中...' : '保存'}</Text>
        </TouchableOpacity>
      </View>
      <WebView
        ref={webViewRef}
        source={{ html: editableHtml }}
        style={styles.webview}
        javaScriptEnabled
        onMessage={onMessage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgCard },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.bgCard,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  titleInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
    paddingVertical: spacing.xs,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  savingBtn: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 14,
    color: colors.textInverse,
    fontWeight: '600',
  },
  webview: { flex: 1 },
});
