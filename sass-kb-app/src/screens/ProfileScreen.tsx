import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileScreen() {
  const { realName, userId, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 用户头像占位 */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {realName ? realName.charAt(0).toUpperCase() : 'U'}
        </Text>
      </View>

      {/* 用户信息 */}
      <Text style={styles.name}>{realName || '未设置姓名'}</Text>
      <Text style={styles.userId}>ID: {userId || '-'}</Text>

      {/* 功能菜单占位 */}
      <View style={styles.menuSection}>
        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>账号信息</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>修改密码</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
        <View style={styles.menuItem}>
          <Text style={styles.menuLabel}>关于</Text>
          <Text style={styles.menuArrow}>›</Text>
        </View>
      </View>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    paddingTop: 60,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1677ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f1f1f',
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    color: '#8c8c8c',
    marginBottom: 32,
  },
  menuSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
    marginBottom: 32,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  menuLabel: {
    fontSize: 16,
    color: '#1f1f1f',
  },
  menuArrow: {
    fontSize: 20,
    color: '#d9d9d9',
  },
  logoutBtn: {
    width: '80%',
    height: 48,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff4d4f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4d4f',
    fontWeight: '500',
  },
});
