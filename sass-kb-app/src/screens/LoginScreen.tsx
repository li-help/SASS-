import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Nav = NativeStackNavigationProp<any>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    try { await login(account, password); }
    catch (e: any) { Alert.alert('登录失败', e.message); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SASS 知识平台</Text>
      <TextInput style={styles.input} placeholder="账号" value={account} onChangeText={setAccount} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>登录</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerText}>还没有账号？立即注册</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, backgroundColor: '#f0f2f5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 48, color: '#1890ff' },
  input: { height: 48, borderWidth: 1, borderColor: '#d9d9d9', borderRadius: 8, paddingHorizontal: 16, marginBottom: 16, backgroundColor: '#fff' },
  button: { height: 48, backgroundColor: '#1890ff', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  registerLink: { marginTop: 24, alignItems: 'center' as const },
  registerText: { fontSize: 15, color: '#1890ff' },
});
