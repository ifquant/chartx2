import type { Callback, ISubscription } from "./isubscription";

type Listener<T1, T2, T3> = {
  callback: Callback<T1, T2, T3>;
  linkedObject?: unknown;
  singleshot: boolean;
};

export class Delegate<T1 = void, T2 = void, T3 = void>
  implements ISubscription<T1, T2, T3>
{
  private listeners: Listener<T1, T2, T3>[] = [];

  public subscribe(
    callback: Callback<T1, T2, T3>,
    linkedObject?: unknown,
    singleshot?: boolean,
  ): void {
    this.listeners.push({
      callback,
      linkedObject,
      singleshot: singleshot === true,
    });
  }

  public unsubscribe(callback: Callback<T1, T2, T3>): void {
    const index = this.listeners.findIndex((listener) => listener.callback === callback);

    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public unsubscribeAll(linkedObject: unknown): void {
    this.listeners = this.listeners.filter(
      (listener) => listener.linkedObject !== linkedObject,
    );
  }

  public fire(param1: T1, param2: T2, param3: T3): void {
    const snapshot = [...this.listeners];
    this.listeners = this.listeners.filter((listener) => !listener.singleshot);
    snapshot.forEach((listener) => listener.callback(param1, param2, param3));
  }

  public hasListeners(): boolean {
    return this.listeners.length > 0;
  }

  public destroy(): void {
    this.listeners = [];
  }
}
