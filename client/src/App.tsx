import { ErrorBoundary } from "./components/error-boundary";
import { MainContent } from "./components/main-content";

export default function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
