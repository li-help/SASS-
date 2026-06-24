import { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { API_BASE_URL } from '@/config';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请输入用户名和密码');
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert('提示', '用户名至少 3 个字符');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少 6 个字符');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          realName: realName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          companyName: companyName.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.code === 200) {
        Alert.alert('注册成功', json.data || '欢迎加入', [
          { text: '去登录', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('注册失败', json.message || '请稍后重试');
      }
    } catch {
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>注册账号</Text>
        <Text style={styles.subtitle}>创建您的 SASS 知识平台账号</Text>

        <TextInput
          style={styles.input}
          placeholder="用户名"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="密码（至少 6 位）"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="确认密码"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="真实姓名（选填）"
          placeholderTextColor="#999"
          value={realName}
          onChangeText={setRealName}
        />
        <TextInput
          style={styles.input}
          placeholder="邮箱（选填）"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="手机号（选填）"
          placeholderTextColor="#999"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="公司/团队名称（选填）"
          placeholderTextColor="#999"
          value={companyName}
          onChangeText={setCompanyName}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledBtn]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? '注册中...' : '注册'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
          <Text style={styles.loginText}>已有账号？立即登录</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  scrollContent: { paddingHorizontal: 32, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#1890ff', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#8c8c8c', marginBottom: 32 },
  input: {
    height: 48, borderWidth: 1, borderColor: '#d9d9d9', borderRadius: 8,
    paddingHorizontal: 16, marginBottom: 14, fontSize: 15,
    backgroundColor: '#fff',
  },
  button: {
    height: 48, backgroundColor: '#1890ff', borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  disabledBtn: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { fontSize: 15, color: '#1890ff' },
});
