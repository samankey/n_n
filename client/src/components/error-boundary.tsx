// src/components/error-boundary.tsx
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center">
          <h2 className="text-2xl font-bold mb-4">
            비밀 장부에 접근할 수 없습니다. 🤫
          </h2>
          <p className="text-gray-500 mb-6">
            시스템에 일시적인 장애가 발생했습니다.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg"
          >
            새로고침 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
