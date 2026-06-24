import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '@/stores/authStore';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { View, ActivityIndicator } from 'react-native';
import { notificationApi } from '@/services/notificationApi';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import HomeScreen from '@/screens/HomeScreen';
import SpaceListScreen from '@/screens/SpaceListScreen';
import DocDetailScreen from '@/screens/DocDetailScreen';
import DocEditScreen from '@/screens/DocEditScreen';
import SearchScreen from '@/screens/SearchScreen';
import NotificationScreen from '@/screens/NotificationScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import DocCreateScreen from '@/screens/DocCreateScreen';
import VersionListScreen from '@/screens/VersionListScreen';
import FilePreviewScreen from '@/screens/FilePreviewScreen';
import FileListScreen from '@/screens/FileListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const SpaceStack = createNativeStackNavigator();
const queryClient = new QueryClient();

function SpaceNavigator() {
  return (
    <SpaceStack.Navigator>
      <SpaceStack.Screen name="SpaceList" component={SpaceListScreen} options={{ title: '知识库' }} />
      <SpaceStack.Screen name="DocDetail" component={DocDetailScreen} options={{ title: '文档详情' }} />
      <SpaceStack.Screen name="DocEdit" component={DocEditScreen} options={{ title: '编辑文档' }} />
      <SpaceStack.Screen name="DocCreate" component={DocCreateScreen} options={{ title: '新建文档' }} />
      <SpaceStack.Screen name="VersionList" component={VersionListScreen} options={{ title: '版本历史' }} />
      <SpaceStack.Screen name="FilePreview" component={FilePreviewScreen} options={{ title: '文件预览' }} />
    </SpaceStack.Navigator>
  );
}

function MainTabs() {
  const { data: unreadData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await notificationApi.unreadCount();
      return res.data?.count || 0;
    },
    refetchInterval: 30_000,
  });
  const unreadCount = typeof unreadData === 'number' ? unreadData : 0;

  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '工作台' }} />
      <Tab.Screen name="Spaces" component={SpaceNavigator} options={{ headerShown: false, title: '知识库' }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: '搜索' }} />
      <Tab.Screen name="Files" component={FileListScreen} options={{ title: '文件' }} />
      <Tab.Screen
        name="Notifications"
        component={NotificationScreen}
        options={{
          title: '消息',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isLoggedIn, restoreSession } = useAuthStore();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setIsRestoring(false));
  }, []);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6F4FE' }}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isLoggedIn ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
