import { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, spacing, radius, shadows } from '@/theme';

type Props = NativeStackScreenProps<any, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [secureText, setSecureText] = useState(true);
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
      const res: any = await api.post('/auth/register', {
        username: username.trim(),
        password,
        realName: realName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
      });
      if (res.code === 200) {
        Alert.alert('注册成功', res.data || '欢迎加入', [
          { text: '去登录', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('注册失败', res.message || '请稍后重试');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message;
      Alert.alert('错误', msg || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    opts?: { secure?: boolean; keyboard?: any; autoCap?: 'none' | 'sentences' },
  ) => (
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color={colors.textTertiary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        value={value}
        onChangeText={onChange}
        secureTextEntry={opts?.secure && secureText}
        keyboardType={opts?.keyboard}
        autoCapitalize={opts?.autoCap || 'none'}
      />
      {opts?.secure && (
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
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* 品牌区 */}
        <View style={styles.brandSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="person-add" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>注册账号</Text>
          <Text style={styles.subtitle}>创建您的 SASS 知识平台账号</Text>
        </View>

        {/* 表单卡片 */}
        <View style={styles.formCard}>
          {renderInput('person-outline', '用户名', username, setUsername)}
          {renderInput('lock-closed-outline', '密码（至少 6 位）', password, setPassword, { secure: true })}
          {renderInput('lock-closed-outline', '确认密码', confirmPassword, setConfirmPassword, { secure: true })}

          <View style={styles.divider} />

          {renderInput('id-card-outline', '真实姓名（选填）', realName, setRealName, { autoCap: 'sentences' })}
          {renderInput('mail-outline', '邮箱（选填）', email, setEmail, { keyboard: 'email-address' })}
          {renderInput('call-outline', '手机号（选填）', phone, setPhone, { keyboard: 'phone-pad' })}
          {renderInput('business-outline', '公司/团队名称（选填）', companyName, setCompanyName, { autoCap: 'sentences' })}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{loading ? '注册中...' : '注 册'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
          <Text style={styles.loginText}>
            已有账号？<Text style={styles.loginHighlight}>立即登录</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  formCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.md,
    marginBottom: spacing.xl,
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
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
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
  loginLink: {
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  loginHighlight: {
    color: colors.primary,
    fontWeight: '500',
  },
});
