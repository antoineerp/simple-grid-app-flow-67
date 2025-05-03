
export interface SyncAttempt {
  id: string;
  tableName: string;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  duration?: number;
  operation: string; // Make operation a required field
}

export interface SyncStatus {
  health: 'good' | 'warning' | 'critical';
  activeCount: number;
  recentAttempts: SyncAttempt[];
  stats: {
    success: number;
    failure: number;
  };
  lastSync: {
    time: number | null;
    success: boolean;
  };
}

class SyncMonitor {
  private attempts: SyncAttempt[] = [];
  private readonly maxAttempts = 50;
  private activeAttempts: Map<string, SyncAttempt> = new Map();

  constructor() {
    // Initialize event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener('syncStarted', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.attemptId) {
        this.recordSyncStart({
          attemptId: customEvent.detail.attemptId,
          tableName: customEvent.detail.tableName,
          operation: customEvent.detail.operation
        });
      }
    });

    window.addEventListener('syncCompleted', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.attemptId) {
        this.recordSyncSuccess(customEvent.detail.attemptId);
      }
    });

    window.addEventListener('syncFailed', (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.attemptId) {
        this.recordSyncFailure(
          customEvent.detail.attemptId,
          customEvent.detail.error || "Unknown error"
        );
      }
    });
  }

  public recordSyncStart({ attemptId, tableName, operation }: { attemptId: string; tableName: string; operation: string }) {
    const attempt: SyncAttempt = {
      id: attemptId,
      tableName,
      startTime: Date.now(),
      success: false,
      operation
    };
    this.activeAttempts.set(attemptId, attempt);
  }

  public recordSyncSuccess(attemptId: string) {
    const attempt = this.activeAttempts.get(attemptId);
    if (!attempt) return;

    const endTime = Date.now();
    const updatedAttempt: SyncAttempt = {
      ...attempt,
      endTime,
      success: true,
      duration: endTime - attempt.startTime
    };

    this.activeAttempts.delete(attemptId);
    this.addAttempt(updatedAttempt);
  }

  public recordSyncFailure(attemptId: string, error: string) {
    const attempt = this.activeAttempts.get(attemptId);
    if (!attempt) return;

    const endTime = Date.now();
    const updatedAttempt: SyncAttempt = {
      ...attempt,
      endTime,
      success: false,
      error,
      duration: endTime - attempt.startTime
    };

    this.activeAttempts.delete(attemptId);
    this.addAttempt(updatedAttempt);
  }

  // Added this method to fix the missing recordSyncEnd
  public recordSyncEnd(attemptId: string, success: boolean, error?: string) {
    if (success) {
      this.recordSyncSuccess(attemptId);
    } else {
      this.recordSyncFailure(attemptId, error || "Unknown error");
    }
  }

  // Added to check if there's an active sync for a specific table
  public hasActiveSync(tableName: string): boolean {
    return Array.from(this.activeAttempts.values()).some(
      attempt => attempt.tableName === tableName
    );
  }

  private addAttempt(attempt: SyncAttempt) {
    this.attempts.unshift(attempt);
    // Keep only the most recent attempts
    if (this.attempts.length > this.maxAttempts) {
      this.attempts.pop();
    }
  }

  public getStatus(): SyncStatus {
    const activeCount = this.activeAttempts.size;
    const recentAttempts = [...this.attempts];
    
    // Calculate statistics
    const successCount = recentAttempts.filter(a => a.success).length;
    const failureCount = recentAttempts.filter(a => !a.success).length;
    
    // Find the most recent sync
    const sortedAttempts = [...recentAttempts].sort((a, b) => 
      (b.endTime || 0) - (a.endTime || 0)
    );
    
    const lastSync = sortedAttempts.length > 0 ? {
      time: sortedAttempts[0].endTime || null,
      success: sortedAttempts[0].success
    } : { time: null, success: false };
    
    // Determine health
    let health: 'good' | 'warning' | 'critical' = 'good';
    const recentFailures = recentAttempts
      .filter(a => !a.success && a.endTime && a.endTime > Date.now() - 15 * 60 * 1000)
      .length;
    
    if (recentFailures >= 5) {
      health = 'critical';
    } else if (recentFailures >= 2) {
      health = 'warning';
    }
    
    return {
      health,
      activeCount,
      recentAttempts,
      stats: {
        success: successCount,
        failure: failureCount
      },
      lastSync
    };
  }
}

export const syncMonitor = new SyncMonitor();
