/**
 * Session-scoped event store for workflow trigger entity attribute dependencies.
 * When a user selects an entity, attributes publish events; other attributes subscribe
 * and update their filters. State is in-memory only (lost on refresh).
 */

export interface EventData {
  eventKey: string;
  attributeName: string;
  attributePath: string;
  attributeType: string;
  attributeValue: unknown;
  entitySpecId: string;
  timestamp: number;
}

export type SubscriptionCallback = (eventData: EventData) => void;

export class EventSessionManager {
  private eventStore = new Map<string, EventData>();
  private subscribers = new Map<string, Set<SubscriptionCallback>>();

  /** Publishes an event and notifies all subscribers. */
  publishEvent(eventKey: string, eventData: EventData): void {
    this.eventStore.set(eventKey, eventData);
    const callbacks = this.subscribers.get(eventKey);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(eventData);
        } catch (err) {
          console.error(`Subscription callback error for ${eventKey}:`, err);
        }
      });
    }
  }

  /**
   * Subscribes to an event. If the event already exists, the callback is invoked immediately.
   * @returns Unsubscribe function.
   */
  subscribe(eventKey: string, callback: SubscriptionCallback): () => void {
    if (!this.subscribers.has(eventKey)) {
      this.subscribers.set(eventKey, new Set());
    }
    this.subscribers.get(eventKey)!.add(callback);

    const existing = this.eventStore.get(eventKey);
    if (existing) {
      try {
        callback(existing);
      } catch (err) {
        console.error(`Subscription initial callback error for ${eventKey}:`, err);
      }
    }

    return () => {
      const set = this.subscribers.get(eventKey);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.subscribers.delete(eventKey);
      }
    };
  }

  getEventValue(eventKey: string): EventData | null {
    return this.eventStore.get(eventKey) ?? null;
  }

  hasRequiredEvent(eventKey: string): boolean {
    if (!this.eventStore.has(eventKey)) return false;

    const event = this.eventStore.get(eventKey)!;
    return event.attributeValue != null;
  }

  /** Clears event store and subscriber map. For form reset, prefer remounting the form. */
  clear(): void {
    this.eventStore.clear();
    this.subscribers.clear();
  }
}
