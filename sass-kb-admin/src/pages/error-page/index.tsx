import { Button, Result } from 'antd';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();
  let title = '页面出错了';
  let message = '未知错误';

  if (isRouteErrorResponse(error)) {
    title = `错误 ${error.status}`;
    message = error.statusText || error.data?.message || '未知错误';
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#0F1923',
    }}>
      <Result
        status="500"
        title={title}
        subTitle={message}
        extra={
          <Button type="primary" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        }
      />
    </div>
  );
}
