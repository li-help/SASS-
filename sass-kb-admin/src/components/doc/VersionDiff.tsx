import { Spin, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { docApi } from '@/services/docService';

interface Props {
  docId: string;
  v1: number;
  v2: number;
}

export default function VersionDiff({ docId, v1, v2 }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ['doc-diff', docId, v1, v2],
    queryFn: () => docApi.diff(docId, v1, v2),
  });

  if (isLoading) {
    return <Spin style={{ display: 'block', margin: '30px auto' }} />;
  }

  const d = data?.data;

  if (!d) {
    return <Empty description="无法加载差异数据" />;
  }

  return (
    <div style={{ display: 'flex', gap: 16, maxHeight: 500, overflow: 'auto' }}>
      <div style={{ flex: 1, border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#ff4d4f' }}>旧版本 v{d.v2Version}</div>
        <div
          dangerouslySetInnerHTML={{ __html: d.v2 || '<p style="color:#999">空内容</p>' }}
          style={{ lineHeight: 1.8, fontSize: 14 }}
        />
      </div>
      <div style={{ flex: 1, border: '1px solid #f0f0f0', borderRadius: 8, padding: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8, color: '#52c41a' }}>新版本 v{d.v1Version}</div>
        <div
          dangerouslySetInnerHTML={{ __html: d.v1 || '<p style="color:#999">空内容</p>' }}
          style={{ lineHeight: 1.8, fontSize: 14 }}
        />
      </div>
    </div>
  );
}
