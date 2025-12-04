import { Component, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error('UI error boundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            Bir şeyler ters gitti.
          </h2>
          <p className="text-sm text-slate-600">
            Lütfen uygulamayı kapatıp tekrar açmayı deneyin. Hata devam ederse
            geliştiriciye bildirin.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}


