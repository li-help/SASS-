import { useParams, useNavigate } from 'react-router-dom';
import FilePreview from '@/components/file/FilePreview';

export default function FilePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) return null;

  return <FilePreview fileId={id} onBack={() => navigate('/file')} />;
}
