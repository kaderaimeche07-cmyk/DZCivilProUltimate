import React from 'react';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import { getInitialLang, getLangDir, TRANSLATIONS } from '../i18n/translations';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const lang = getInitialLang();
    return {
      hasError: true,
      errorMessage: error?.message || TRANSLATIONS[lang].errorBoundary.fallbackMsg,
    };
  }

  componentDidCatch() {
    // Graceful recovery screen shown to user
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  handleResetLocalData = () => {
    try {
      localStorage.removeItem('dz_civil_pro_boq_v1');
    } catch {
      // Ignore storage errors
    }
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      const lang = getInitialLang();
      const dir = getLangDir(lang);
      const t = TRANSLATIONS[lang].errorBoundary;
      return (
        <div
          dir={dir}
          className="min-h-screen bg-[#0b110d] text-[#f4f7f2] flex items-center justify-center p-4"
        >
          <div className="glass-surface max-w-md w-full rounded-2xl p-6 space-y-4 text-center border border-[#f59e0b]/40">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f59e0b]/15 text-[#fbbf24]">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <h1 className="text-lg font-bold text-white">
              {t.title}
            </h1>
            <p className="text-xs leading-relaxed text-[#a3b8a8]">
              {t.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="btn-kiwi flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>{t.retry}</span>
              </button>
              <button
                type="button"
                onClick={this.handleResetLocalData}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1a261e] px-4 py-2 text-xs font-semibold text-[#fbbf24] hover:border-[#f59e0b]/50 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t.resetData}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
