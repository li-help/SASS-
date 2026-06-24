import { Component, type ReactNode } from 'react';
import { Button, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <Result
          status="500"
          title="页面出错了"
          subTitle={this.state.error?.message || '未知错误'}
          extra={
            <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleReset}>
              重新加载
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}
