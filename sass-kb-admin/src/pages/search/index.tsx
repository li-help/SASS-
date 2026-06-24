import { useState } from 'react';
import { Typography, Input, List, Tag, Spin, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '@/services/searchService';
import type { SearchResult } from '@/services/searchService';

const { Title, Text } = Typography;

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, isFetched } = useQuery({
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
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>搜索</Title>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Input.Search
          size="large"
          placeholder="搜索文档..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
          enterButton
        />
      </div>

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
      ) : isFetched && searchText ? (
        <>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            找到 {total} 条结果
          </Text>
          <List
            dataSource={results}
            renderItem={(item: SearchResult) => (
              <List.Item
                style={{ cursor: 'pointer', padding: '16px 0' }}
                onClick={() => navigate(`/doc/${item.id}`)}
              >
                <List.Item.Meta
                  avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                  title={
                    <span style={{ fontSize: 16 }}>
                      {item.title}
                      {item.score != null && (
                        <Tag style={{ marginLeft: 8 }} color="geekblue">{Math.round(item.score * 100)}%</Tag>
                      )}
                    </span>
                  }
                  description={
                    item.updatedAt
                      ? `更新于 ${new Date(item.updatedAt).toLocaleString('zh-CN')}`
                      : ''
                  }
                />
              </List.Item>
            )}
            pagination={total > 20 ? {
              current: page,
              total,
              pageSize: 20,
              onChange: setPage,
            } : undefined}
          />
        </>
      ) : searchText ? (
        <Empty description="未找到结果" />
      ) : (
        <Empty description="输入关键词搜索文档" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
}
