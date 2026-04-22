import type { TradeLocationIntent } from "$lib/chartx/public/performance";

type TradeLocator = {
  locateTrade?(intent: TradeLocationIntent): boolean;
};

type RetryScheduler = (flush: () => void) => void;

const scheduleMicrotaskRetry: RetryScheduler = (flush) => {
  queueMicrotask(flush);
};

export function createWorkbenchTradeIntentBridge(
  scheduleRetry: RetryScheduler = scheduleMicrotaskRetry,
) {
  let pendingIntent: TradeLocationIntent | null = null;
  let locator: TradeLocator | null = null;
  let retryScheduled = false;
  let flushInProgress = false;
  let rerunRequested = false;

  const flush = (): boolean => {
    if (flushInProgress) {
      rerunRequested = true;
      return false;
    }

    if (pendingIntent === null || locator === null) {
      return false;
    }

    flushInProgress = true;
    try {
      const applied = locator.locateTrade?.(pendingIntent) ?? false;
      if (applied) {
        pendingIntent = null;
        retryScheduled = false;
      } else if (!retryScheduled) {
        retryScheduled = true;
        scheduleRetry(() => {
          retryScheduled = false;
          flush();
        });
      }

      return applied;
    } finally {
      flushInProgress = false;
      if (rerunRequested) {
        rerunRequested = false;
        if (pendingIntent !== null) {
          flush();
        }
      }
    }
  };

  return {
    queue(intent: TradeLocationIntent): void {
      pendingIntent = intent;
      flush();
    },
    connect(nextLocator: TradeLocator): void {
      locator = nextLocator;
      flush();
    },
    disconnect(): void {
      locator = null;
      retryScheduled = false;
      flushInProgress = false;
      rerunRequested = false;
    },
    publishSnapshot(): void {
      flush();
    },
    pendingIntent(): TradeLocationIntent | null {
      return pendingIntent;
    },
  };
}
