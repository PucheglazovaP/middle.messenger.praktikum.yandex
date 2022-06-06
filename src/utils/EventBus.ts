type AnyFunc = (...args: any[]) => any | void;

export default class EventBus {
  private listeners: Record<string, AnyFunc[]>;

  constructor() {
    this.listeners = {};
  }

  on(event: string | number, callback: AnyFunc) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }

    this.listeners[event].push(callback);
  }

  off(event: string | number, callback: AnyFunc) {
    if (!this.listeners[event]) {
      throw new Error(`Нет события: ${event}`);
    }

    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  }

  emit(event: string | number, ...args: any[]) {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event].forEach((listener) => {
      listener(...args);
    });
  }
}
