'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                    <div className="bg-rose-100 p-3 rounded-full text-rose-500">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Something went wrong</h2>
                    <p className="text-slate-600 max-w-md">
                        We encountered an unexpected error showing this gallery. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors font-medium"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
