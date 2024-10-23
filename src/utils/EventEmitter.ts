export class EventEmitter {
    private readonly events: Map<string | number, Array<CallableFunction>> =
        new Map();

    public emit(eventName: string | number, args?: unknown): void {
        const event = this.events.get(eventName);

        if (!event) {
            return;
        }

        event.forEach((callback: CallableFunction) => callback(args));
    }

    public subscribe(
        eventName: string | number,
        callback: CallableFunction,
    ): void {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        this.events.get(eventName)!.push(callback);
    }

    public clearSubscriptionsByName(eventName: string | number): void {
        const callbackList = this.events.get(eventName);

        if (!callbackList) {
            return;
        }

        this.events.set(eventName, []);
    }

    public unsubscribe(
        eventName: string | number,
        callback: CallableFunction,
    ): void {
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
