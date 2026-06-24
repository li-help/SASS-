import { useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchApi } from '@/services/searchService';

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
  const total = data?.data?.total || 0;

  const handleSearch = () => {
    if (keyword.trim()) {
      setSearchText(keyword.trim());
      setPage(1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <TextInput
          style={styles.input}
          placeholder="搜索文档..."
          placeholderTextColor="#999"
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#1677ff" style={{ marginTop: 40 }} />
      ) : searchText ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => navigation.navigate('Spaces', {
                screen: 'DocDetail',
                params: { docId: item.id },
              })}
            >
              <Text style={styles.resultTitle}>{item.title}</Text>
              <Text style={styles.resultMeta}>
                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('zh-CN') : ''}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>未找到结果</Text>}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.emptyText}>输入关键词搜索文档</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
  },
  searchBtn: {
    backgroundColor: '#1677ff',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  listContent: { padding: 16 },
  resultItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  resultTitle: { fontSize: 16, fontWeight: '500', color: '#1f1f1f', marginBottom: 4 },
  resultMeta: { fontSize: 12, color: '#8c8c8c' },
  emptyText: { textAlign: 'center', color: '#8c8c8c', fontSize: 15, marginTop: 60 },
});
