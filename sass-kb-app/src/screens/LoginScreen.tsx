import { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, shadows } from '@/theme';

type Nav = NativeStackNavigationProp<any>;

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!account.trim() || !password.trim()) {
      Alert.alert('提示', '请输入账号和密码');
      return;
    }
    setLoading(true);
    try {
      await login(account.trim(), password);
    } catch (e: any) {
      Alert.alert('登录失败', e.message || '请检查账号密码或网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* 品牌区 */}
      <View style={styles.brandSection}>
        <View style={styles.logoCircle}>
          <Ionicons name="library" size={36} color={colors.primary} />
        </View>
        <Text style={styles.brandTitle}>SASS 知识平台</Text>
        <Text style={styles.brandSubtitle}>企业知识库管理系统</Text>
      </View>

      {/* 表单卡片 */}
      <View style={styles.formCard}>
        <View style={styles.inputWrapper}>
          <Ionicons name="person-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="账号"
            placeholderTextColor={colors.textTertiary}
            value={account}
            onChangeText={setAccount}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
          />
          <TouchableOpacity
            onPress={() => setSecureText(!secureText)}
            style={styles.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={secureText ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{loading ? '登录中...' : '登 录'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            还没有账号？<Text style={styles.registerHighlight}>立即注册</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.bgPage,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    backgroundColor: colors.bgInput,
  },
  inputIcon: {
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    color: colors.textPrimary,
  },
  eyeBtn: {
    paddingHorizontal: spacing.md,
    height: 48,
    justifyContent: 'center',
  },
  button: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
  },
  registerLink: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  registerHighlight: {
    color: colors.primary,
    fontWeight: '500',
  },
});
