// Performance monitoring utility for tracking loading times

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = __DEV__; // Only enable in development

  startTimer(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  endTimer(name: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.enabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance timer "${name}" not found`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Log performance data in development
    if (__DEV__) {
      console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`, metric.metadata || '');
    }

    return metric.duration;
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  // Utility function to measure async operations
  async measureAsync<T>(
    name: string, 
    operation: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(name, metadata);
    
    try {
      const result = await operation();
      this.endTimer(name, { success: true });
      return result;
    } catch (error) {
      this.endTimer(name, { success: false, error: error.message });
      throw error;
    }
  }

  // Utility function to measure sync operations
  measureSync<T>(
    name: string, 
    operation: () => T, 
    metadata?: Record<string, any>
  ): T {
    this.startTimer(name, metadata);
    
    try {
      const result = operation();
      this.endTimer(name, { success: true });
      return result;
    } catch (error) {
      this.endTimer(name, { success: false, error: error.message });
      throw error;
    }
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility for measuring database query performance
export const measureQuery = <T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.measureAsync(queryName, query, { type: 'database_query' });
};

// Utility for measuring API call performance
export const measureApiCall = <T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> => {
  return performanceMonitor.measureAsync(apiName, apiCall, { type: 'api_call' });
};

export default performanceMonitor; 