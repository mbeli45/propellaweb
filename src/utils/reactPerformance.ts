import React, { useEffect } from 'react';
import { performanceMonitor } from './performance';

// Hook for measuring component render times
export function usePerformanceTimer(name: string, dependencies: any[] = []) {
  if (!__DEV__) return;
  
  useEffect(() => {
    performanceMonitor.startTimer(`render:${name}`);
    
    return () => {
      performanceMonitor.endTimer(`render:${name}`);
    };
  }, dependencies);
}

// Higher-order component for measuring render performance
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    usePerformanceTimer(componentName, [props]);
    return <WrappedComponent {...props} />;
  });
}

// Hook for measuring async operations in components
export function useAsyncPerformance<T>(
  operation: () => Promise<T>,
  operationName: string,
  dependencies: any[] = []
) {
  const [result, setResult] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const executeOperation = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await performanceMonitor.measureAsync(operationName, operation);
      setResult(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [operation, operationName]);

  useEffect(() => {
    executeOperation();
  }, dependencies);

  return { result, loading, error, refetch: executeOperation };
} 