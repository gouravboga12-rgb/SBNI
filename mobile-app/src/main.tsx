import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in JustPaisa App:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-xl w-full bg-white border border-rose-200 rounded-3xl p-8 shadow-xl space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <h1 className="text-xl font-extrabold font-heading text-slate-900">Application Error Detected</h1>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-left text-xs text-rose-800 font-mono overflow-x-auto space-y-1">
              <div className="font-bold">{this.state.error?.name}: {this.state.error?.message}</div>
              <pre className="text-[10px] text-rose-600 whitespace-pre-wrap">{this.state.error?.stack}</pre>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-3 bg-[#003893] hover:bg-[#002669] text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Clear Storage & Reload JustPaisa Portal
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
