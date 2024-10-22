export class EventEmitter {
    private readonly events: Map<string, Array<CallableFunction>> = new Map();

    public emit(eventName: string, args?: unknown): void {
        const event = this.events.get(eventName);

        if (!event) {
            return;
        }

        event.forEach((callback: CallableFunction) => callback(args));
    }

    public subscribe(eventName: string, callback: CallableFunction): void {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        this.events.get(eventName)!.push(callback);
    }

    public clearSubscriptionsByName(eventName: string): void {
        const callbackList = this.events.get(eventName);

        if (!callbackList) {
            return;
        }

        this.events.set(eventName, []);
    }

    public unsubscribe(eventName: string, callback: CallableFunction): void {
        const callbackList = this.events.get(eventName);

        if (!callbackList) {
            return;
        }

        const filteredCallbackList = callbackList.filter(
            (eventCallback) => eventCallback !== callback,
        );

        this.events.set(eventName, filteredCallbackList);
    }
}
