import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React Component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 flex flex-col items-center justify-center text-center bg-rose-50/80 border-2 border-rose-200 rounded-3xl space-y-4 shadow-sm my-4">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-rose-300">
            <AlertTriangle className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-black text-rose-950 uppercase tracking-tight">
              {this.props.fallbackTitle || 'Đã Xảy Ra Lỗi Hiển Thị Bài Test'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dữ liệu bài test đang được cập nhật hoặc có sự cố không mong muốn. Vui lòng nhấn nút bên dưới để khôi phục và tiếp tục.
            </p>
            {this.state.error?.message && (
              <p className="text-[10.5px] font-mono text-rose-700 bg-rose-100/80 p-2 rounded-xl text-left truncate border border-rose-200">
                Chi tiết: {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Tải Lại Trang</span>
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  const url = new URL(window.location.href);
                  url.searchParams.delete('vocabTestId');
                  url.searchParams.delete('reviewTestId');
                  url.searchParams.delete('vt');
                  window.location.href = url.pathname;
                } catch (e) {
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
