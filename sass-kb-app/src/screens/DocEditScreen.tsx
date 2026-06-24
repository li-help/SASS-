import { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TextInput, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery, useMutation } from '@tanstack/react-query';
import { docApi } from '@/services/docService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'DocEdit'>;

export default function DocEditScreen({ route, navigation }: Props) {
  const { docId } = route.params as { docId: string };
  const webViewRef = useRef<WebView>(null);
  const [title, setTitle] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [version, setVersion] = useState(1);
  const [originalContentJson, setOriginalContentJson] = useState('');
  const [loaded, setLoaded] = useState(false);

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
    mutationFn: () =>
      docApi.save(docId, {
        title,
        contentJson: originalContentJson,
        contentHtml,
        version,
      }),
    onSuccess: (res: any) => {
      if (res.code === 200) {
        Alert.alert('提示', '保存成功');
        if (res.data?.version) setVersion(res.data.version);
      } else if (res.code === 409) {
        Alert.alert('冲突', '文档已被他人修改，请刷新后重试');
      } else {
        Alert.alert('错误', res.message || '保存失败');
      }
    },
    onError: () => {
      Alert.alert('错误', '保存失败，请检查网络');
    },
  });

  // 保存按钮回调
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
        setContentHtml(data.html);
        saveMut.mutate();
      }
      if (data.type === 'loaded') {
        setLoaded(true);
      }
    } catch {
      // ignore parse errors
    }
  }, [saveMut]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1677ff" />
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
    color: #1f1f1f;
    margin: 0;
  }
  body:focus { outline: none; }
  img { max-width: 100%; height: auto; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #e0e0e0; padding: 8px; }
  pre { background: #f5f5f5; padding: 12px; border-radius: 6px; }
</style>
</head>
<body contenteditable="true">${contentHtml}</body>
<script>
  document.body.addEventListener('focus', function() {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'loaded' }));
  });
</script>
</html>`;

  return (
    <View style={styles.container}>
      <View style={styles.titleBar}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="文档标题"
          placeholderTextColor="#999"
        />
        <Text style={styles.saveBtn} onPress={handleSave}>
          {saveMut.isPending ? '保存中...' : '保存'}
        </Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  titleInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f1f1f',
    paddingVertical: 6,
  },
  saveBtn: {
    fontSize: 16,
    color: '#1677ff',
    fontWeight: '600',
    marginLeft: 12,
  },
  webview: { flex: 1 },
});
