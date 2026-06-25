import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '@/services/searchService';
import { colors, spacing, radius, shadows } from '@/theme';

type Nav = NativeStackNavigationProp<any>;

export default function SearchScreen() {
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const navigation = useNavigation<Nav>();

  const { data, isLoading } = useQuery({
    queryKey: ['search', searchText, page],
    queryFn: () => searchApi.search({ q: searchText, page, size: 20 }),
    enabled: searchText.length > 0,
  });

  const results = data?.data?.records || [];

  const handleSearch = () => {
    if (keyword.trim()) {
      setSearchText(keyword.trim());
      setPage(1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={{ marginRight: spacing.sm }} />
          <TextInput
            style={styles.input}
            placeholder="搜索文档..."
            placeholderTextColor={colors.textTertiary}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.7}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : searchText ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Spaces', {
                screen: 'DocDetail',
                params: { docId: item.id },
              })}
            >
              <View style={styles.resultHeader}>
                <Ionicons name="document-text" size={18} color={colors.primary} />
                <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
              </View>
              <Text style={styles.resultMeta}>
                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('zh-CN') : ''}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>未找到结果</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={colors.border} />
          <Text style={styles.emptyText}>输入关键词搜索文档</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPage },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgInput,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 40,
    justifyContent: 'center',
    ...shadows.sm,
  },
  searchBtnText: { color: colors.textInverse, fontSize: 15, fontWeight: '600' },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  resultItem: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm + 2,
    ...shadows.sm,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  resultTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  resultMeta: { fontSize: 12, color: colors.textTertiary, marginLeft: 26 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: { color: colors.textTertiary, fontSize: 15, marginTop: spacing.md },
});
