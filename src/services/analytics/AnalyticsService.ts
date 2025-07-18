// // src/services/analytics/AnalyticsService.ts

// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { Platform } from 'react-native';
// import { CameraFlowStep } from '../../types/cameraFlow';

// /**
//  * Analytics event interface
//  */
// export interface AnalyticsEvent {
//   readonly name: string;
//   readonly properties: Record<string, any>;
//   readonly timestamp: number;
//   readonly sessionId: string;
//   readonly userId?: string;
//   readonly platform: string;
//   readonly appVersion?: string;
// }

// /**
//  * Performance metric interface
//  */
// export interface PerformanceMetric {
//   readonly name: string;
//   readonly value: number;
//   readonly unit: 'ms' | 'bytes' | 'count' | 'percentage';
//   readonly metadata?: Record<string, any>;
//   readonly timestamp: number;
// }

// /**
//  * Analytics configuration
//  */
// export interface AnalyticsConfig {
//   enabled: boolean;
//   debugMode: boolean;
//   offlineQueue: boolean;
//   maxQueueSize: number;
//   flushInterval: number;
//   enablePerformanceTracking: boolean;
//   enableErrorTracking: boolean;
//   enableUserInteractionTracking: boolean;
// }

// /**
//  * Analytics provider interface
//  */
// export interface AnalyticsProvider {
//   initialize(): Promise<void>;
//   trackEvent(event: AnalyticsEvent): Promise<void>;
//   trackPerformance(metric: PerformanceMetric): Promise<void>;
//   setUserProperties(properties: Record<string, any>): Promise<void>;
//   flush(): Promise<void>;
// }

// /**
//  * Console Analytics Provider (for development)
//  */
// class ConsoleAnalyticsProvider implements AnalyticsProvider {
//   async initialize(): Promise<void> {
//     console.log('[Analytics] Console provider initialized');
//   }

//   async trackEvent(event: AnalyticsEvent): Promise<void> {
//     console.log('[Analytics] Event:', event.name, event.properties);
//   }

//   async trackPerformance(metric: PerformanceMetric): Promise<void> {
//     console.log('[Analytics] Performance:', metric.name, `${metric.value}${metric.unit}`);
//   }

//   async setUserProperties(properties: Record<string, any>): Promise<void> {
//     console.log('[Analytics] User Properties:', properties);
//   }

//   async flush(): Promise<void> {
//     console.log('[Analytics] Console provider flushed');
//   }
// }

// /**
//  * Firebase Analytics Provider (for production)
//  */
// class FirebaseAnalyticsProvider implements AnalyticsProvider {
//   private analytics: any = null;

//   async initialize(): Promise<void> {
//     try {
//       // Import Firebase Analytics dynamically to avoid errors if not configured
//       const { getAnalytics, logEvent } = await import('@react-native-firebase/analytics');
//       this.analytics = getAnalytics();
//       console.log('[Analytics] Firebase provider initialized');
//     } catch (error) {
//       console.warn('[Analytics] Firebase Analytics not available:', error);
//       // Fallback to console provider
//     }
//   }

//   async trackEvent(event: AnalyticsEvent): Promise<void> {
//     if (!this.analytics) return;

//     try {
//       // Firebase has limits on event name length and property keys
//       const sanitizedName = this.sanitizeEventName(event.name);
//       const sanitizedProperties = this.sanitizeProperties(event.properties);

//       await this.analytics.logEvent(sanitizedName, sanitizedProperties);
//     } catch (error) {
//       console.error('[Analytics] Firebase event tracking failed:', error);
//     }
//   }

//   async trackPerformance(metric: PerformanceMetric): Promise<void> {
//     if (!this.analytics) return;

//     try {
//       await this.analytics.logEvent('performance_metric', {
//         metric_name: metric.name,
//         metric_value: metric.value,
//         metric_unit: metric.unit,
//         ...metric.metadata,
//       });
//     } catch (error) {
//       console.error('[Analytics] Firebase performance tracking failed:', error);
//     }
//   }

//   async setUserProperties(properties: Record<string, any>): Promise<void> {
//     if (!this.analytics) return;

//     try {
//       const sanitizedProperties = this.sanitizeProperties(properties);
//       await this.analytics.setUserProperties(sanitizedProperties);
//     } catch (error) {
//       console.error('[Analytics] Firebase user properties failed:', error);
//     }
//   }

//   async flush(): Promise<void> {
//     // Firebase automatically handles batching
//   }

//   private sanitizeEventName(name: string): string {
//     // Firebase event names must be <= 40 characters and contain only alphanumeric characters and underscores
//     return name
//       .toLowerCase()
//       .replace(/[^a-z0-9_]/g, '_')
//       .substring(0, 40);
//   }

//   private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
//     const sanitized: Record<string, any> = {};

//     Object.entries(properties).forEach(([key, value]) => {
//       // Firebase property keys must be <= 24 characters
//       const sanitizedKey = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 24);

//       // Convert values to supported types
//       if (typeof value === 'string') {
//         sanitized[sanitizedKey] = value.substring(0, 100); // Firebase string limit
//       } else if (typeof value === 'number' || typeof value === 'boolean') {
//         sanitized[sanitizedKey] = value;
//       } else {
//         sanitized[sanitizedKey] = String(value).substring(0, 100);
//       }
//     });

//     return sanitized;
//   }
// }

// /**
//  * Main Analytics Service
//  */
// class AnalyticsServiceClass {
//   private config: AnalyticsConfig;
//   private providers: AnalyticsProvider[] = [];
//   private eventQueue: AnalyticsEvent[] = [];
//   private performanceQueue: PerformanceMetric[] = [];
//   private sessionId: string;
//   private userId?: string;
//   private isInitialized = false;
//   private flushTimer?: NodeJS.Timeout;

//   constructor() {
//     this.config = {
//       enabled: true,
//       debugMode: __DEV__,
//       offlineQueue: true,
//       maxQueueSize: 100,
//       flushInterval: 30000, // 30 seconds
//       enablePerformanceTracking: true,
//       enableErrorTracking: true,
//       enableUserInteractionTracking: true,
//     };

//     this.sessionId = this.generateSessionId();
//     this.initializeProviders();
//   }

//   /**
//    * Initialize analytics service
//    */
//   async initialize(config?: Partial<AnalyticsConfig>): Promise<void> {
//     if (this.isInitialized) return;

//     this.config = { ...this.config, ...config };

//     if (!this.config.enabled) {
//       console.log('[Analytics] Analytics disabled');
//       return;
//     }

//     try {
//       // Initialize all providers
//       await Promise.all(this.providers.map(provider => provider.initialize()));

//       // Start flush timer
//       if (this.config.offlineQueue) {
//         this.startFlushTimer();
//       }

//       // Load queued events from storage
//       await this.loadQueuedEvents();

//       this.isInitialized = true;
//       console.log('[Analytics] Service initialized successfully');

//       // Track initialization
//       this.trackEvent('analytics_initialized', {
//         providers_count: this.providers.length,
//         config: this.config,
//       });
//     } catch (error) {
//       console.error('[Analytics] Initialization failed:', error);
//     }
//   }

//   /**
//    * Track an analytics event
//    */
//   trackEvent(eventName: string, properties: Record<string, any> = {}): void {
//     if (!this.config.enabled) return;

//     const event: AnalyticsEvent = {
//       name: eventName,
//       properties: {
//         ...properties,
//         session_id: this.sessionId,
//         user_id: this.userId,
//         timestamp: Date.now(),
//       },
//       timestamp: Date.now(),
//       sessionId: this.sessionId,
//       userId: this.userId,
//       platform: Platform.OS,
//       appVersion: this.getAppVersion(),
//     };

//     if (this.config.debugMode) {
//       console.log('[Analytics] Tracking event:', eventName, properties);
//     }

//     // Add to queue
//     this.eventQueue.push(event);

//     // Trim queue if too large
//     if (this.eventQueue.length > this.config.maxQueueSize) {
//       this.eventQueue = this.eventQueue.slice(-this.config.maxQueueSize);
//     }

//     // Immediate flush for critical events
//     if (this.isCriticalEvent(eventName)) {
//       this.flush();
//     }
//   }

//   /**
//    * Track performance metric
//    */
//   trackPerformance(
//     metricName: string,
//     value: number,
//     unit: PerformanceMetric['unit'] = 'ms',
//     metadata?: Record<string, any>
//   ): void {
//     if (!this.config.enabled || !this.config.enablePerformanceTracking) return;

//     const metric: PerformanceMetric = {
//       name: metricName,
//       value,
//       unit,
//       metadata: {
//         ...metadata,
//         session_id: this.sessionId,
//         platform: Platform.OS,
//       },
//       timestamp: Date.now(),
//     };

//     if (this.config.debugMode) {
//       console.log('[Analytics] Performance metric:', metricName, `${value}${unit}`);
//     }

//     this.performanceQueue.push(metric);

//     // Trim queue if too large
//     if (this.performanceQueue.length > this.config.maxQueueSize) {
//       this.performanceQueue = this.performanceQueue.slice(-this.config.maxQueueSize);
//     }
//   }

//   /**
//    * Track camera workflow specific events
//    */
//   trackCameraEvent(
//     eventType: 'step_entered' | 'step_exited' | 'step_navigation' | 'workflow_completed' | 'workflow_cancelled' | 'component_error' | 'workflow_error',
//     properties: Record<string, any> = {}
//   ): void {
//     this.trackEvent(`camera_${eventType}`, {
//       ...properties,
//       workflow_type: 'receipt_processing',
//       feature: 'camera_workflow',
//     });
//   }

//   /**
//    * Track user interaction
//    */
//   trackUserInteraction(
//     action: string,
//     element: string,
//     properties: Record<string, any> = {}
//   ): void {
//     if (!this.config.enableUserInteractionTracking) return;

//     this.trackEvent('user_interaction', {
//       action,
//       element,
//       ...properties,
//     });
//   }

//   /**
//    * Track error
//    */
//   trackError(
//     error: Error | string,
//     context?: Record<string, any>
//   ): void {
//     if (!this.config.enableErrorTracking) return;

//     const errorMessage = typeof error === 'string' ? error : error.message;
//     const errorStack = typeof error === 'string' ? undefined : error.stack;

//     this.trackEvent('app_error', {
//       error_message: errorMessage,
//       error_stack: errorStack,
//       error_type: typeof error === 'string' ? 'string' : error.constructor.name,
//       ...context,
//     });
//   }

//   /**
//    * Set user ID
//    */
//   setUserId(userId: string): void {
//     this.userId = userId;
//     this.setUserProperties({ user_id: userId });
//   }

//   /**
//    * Set user properties
//    */
//   setUserProperties(properties: Record<string, any>): void {
//     if (!this.config.enabled) return;

//     this.providers.forEach(provider => {
//       provider.setUserProperties(properties).catch(error => {
//         console.error('[Analytics] Failed to set user properties:', error);
//       });
//     });
//   }

//   /**
//    * Flush queued events
//    */
//   async flush(): Promise<void> {
//     if (!this.isInitialized || !this.config.enabled) return;

//     const eventsToFlush = [...this.eventQueue];
//     const metricsToFlush = [...this.performanceQueue];

//     // Clear queues
//     this.eventQueue = [];
//     this.performanceQueue = [];

//     try {
//       // Send events to all providers
//       await Promise.all(
//         this.providers.map(async provider => {
//           // Flush events
//           for (const event of eventsToFlush) {
//             await provider.trackEvent(event);
//           }

//           // Flush performance metrics
//           for (const metric of metricsToFlush) {
//             await provider.trackPerformance(metric);
//           }

//           await provider.flush();
//         })
//       );

//       if (this.config.debugMode && eventsToFlush.length > 0) {
//         console.log(`[Analytics] Flushed ${eventsToFlush.length} events and ${metricsToFlush.length} metrics`);
//       }
//     } catch (error) {
//       console.error('[Analytics] Flush failed:', error);

//       // Re-queue events if flush failed and offline queue is enabled
//       if (this.config.offlineQueue) {
//         this.eventQueue.unshift(...eventsToFlush);
//         this.performanceQueue.unshift(...metricsToFlush);
//       }
//     }

//     // Save to storage for offline support
//     if (this.config.offlineQueue) {
//       await this.saveQueuedEvents();
//     }
//   }

//   /**
//    * Clean up analytics service
//    */
//   async cleanup(): Promise<void> {
//     if (this.flushTimer) {
//       clearInterval(this.flushTimer);
//     }

//     await this.flush();
//     this.isInitialized = false;
//   }

//   // Private methods

//   private initializeProviders(): void {
//     if (__DEV__ || this.config.debugMode) {
//       this.providers.push(new ConsoleAnalyticsProvider());
//     }

//     // Add Firebase Analytics in production
//     if (!__DEV__) {
//       this.providers.push(new FirebaseAnalyticsProvider());
//     }
//   }

//   private generateSessionId(): string {
//     return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//   }

//   private getAppVersion(): string {
//     // You can import this from your app config or package.json
//     return '1.0.0';
//   }

//   private isCriticalEvent(eventName: string): boolean {
//     const criticalEvents = [
//       'app_error',
//       'camera_workflow_error',
//       'camera_component_error',
//       'app_crash',
//     ];
//     return criticalEvents.includes(eventName);
//   }

//   private startFlushTimer(): void {
//     this.flushTimer = setInterval(() => {
//       this.flush();
//     }, this.config.flushInterval);
//   }

//   private async loadQueuedEvents(): Promise<void> {
//     try {
//       const queuedEvents = await AsyncStorage.getItem('analytics_events_queue');
//       const queuedMetrics = await AsyncStorage.getItem('analytics_metrics_queue');

//       if (queuedEvents) {
//         const events = JSON.parse(queuedEvents) as AnalyticsEvent[];
//         this.eventQueue.push(...events);
//       }

//       if (queuedMetrics) {
//         const metrics = JSON.parse(queuedMetrics) as PerformanceMetric[];
//         this.performanceQueue.push(...metrics);
//       }
//     } catch (error) {
//       console.error('[Analytics] Failed to load queued events:', error);
//     }
//   }

//   private async saveQueuedEvents(): Promise<void> {
//     try {
//       await AsyncStorage.setItem('analytics_events_queue', JSON.stringify(this.eventQueue));
//       await AsyncStorage.setItem('analytics_metrics_queue', JSON.stringify(this.performanceQueue));
//     } catch (error) {
//       console.error('[Analytics] Failed to save queued events:', error);
//     }
//   }
// }

// /**
//  * Performance tracking utilities
//  */
// export class PerformanceTracker {
//   private startTimes = new Map<string, number>();

//   start(operation: string): void {
//     this.startTimes.set(operation, Date.now());
//   }

//   end(operation: string, metadata?: Record<string, any>): number {
//     const startTime = this.startTimes.get(operation);
//     if (!startTime) {
//       console.warn(`[PerformanceTracker] No start time found for operation: ${operation}`);
//       return 0;
//     }

//     const duration = Date.now() - startTime;
//     this.startTimes.delete(operation);

//     AnalyticsService.trackPerformance(operation, duration, 'ms', metadata);
//     return duration;
//   }

//   measure<T>(operation: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): T | Promise<T> {
//     this.start(operation);

//     try {
//       const result = fn();

//       if (result instanceof Promise) {
//         return result.finally(() => {
//           this.end(operation, metadata);
//         });
//       } else {
//         this.end(operation, metadata);
//         return result;
//       }
//     } catch (error) {
//       this.end(operation, { ...metadata, error: true });
//       throw error;
//     }
//   }
// }

// /**
//  * Camera workflow analytics helpers
//  */
// export const CameraAnalytics = {
//   trackStepEntered: (step: CameraFlowStep, flowId?: string) => {
//     AnalyticsService.trackCameraEvent('step_entered', { step, flowId });
//   },

//   trackStepExited: (step: CameraFlowStep, flowId?: string) => {
//     AnalyticsService.trackCameraEvent('step_exited', { step, flowId });
//   },

//   trackNavigation: (from: CameraFlowStep, to: CameraFlowStep, direction: 'forward' | 'backward', flowId?: string) => {
//     AnalyticsService.trackCameraEvent('step_navigation', { from, to, direction, flowId });
//   },

//   trackWorkflowCompleted: (flowId: string, totalSteps: number, completionTime: number) => {
//     AnalyticsService.trackCameraEvent('workflow_completed', {
//       flowId,
//       totalSteps,
//       completionTime,
//       completion_rate: 100
//     });
//   },

//   trackWorkflowCancelled: (step: CameraFlowStep, reason: string, flowId?: string) => {
//     AnalyticsService.trackCameraEvent('workflow_cancelled', { step, reason, flowId });
//   },

//   trackError: (step: CameraFlowStep, code: string, message: string, flowId?: string) => {
//     AnalyticsService.trackCameraEvent('workflow_error', { step, code, message, flowId });
//   },

//   trackComponentError: (error: string, errorInfo?: string, flowId?: string) => {
//     AnalyticsService.trackCameraEvent('component_error', { error, errorInfo, flowId });
//   },
// };

// // Export singleton instance
// export const AnalyticsService = new AnalyticsServiceClass();

// // Export performance tracker
// export const performanceTracker = new PerformanceTracker();

// export default AnalyticsService;
