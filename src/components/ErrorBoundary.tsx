import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error in Mockpit:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 text-2xl font-bold">
              !
            </div>
            <h1 className="text-xl font-semibold text-slate-100 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-4">
              An unexpected error occurred while rendering the infotainment workspace.
            </p>
            {this.state.error && (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-rose-300">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-medium text-sm rounded-lg transition-colors"
              >
                Reload App
              </button>
              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm rounded-lg border border-slate-700 transition-colors"
              >
                Reset State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

