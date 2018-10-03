import {set, get, uniqueId, extend, defaults, result, each, clone, once, keys, isEqual} from "lodash";

export namespace Chop {
    export interface ModelFillOpts {
        silent?: boolean;
    }

    export interface EventCallback<CONTEXT> {
        callback: (ctx: CONTEXT, ...args: any[]) => void;
        context: CONTEXT;
        ctx: any;
    }

    export type EventsHash = { [eventName: string]: EventCallback<any>[] };

    function applyMixins(derivedCtor: any, baseCtors: any[]) {
        baseCtors.forEach(baseCtor => {
            Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
                derivedCtor.prototype[name] = baseCtor.prototype[name];
            });
        });
    }

    export class Eventable {
        _events!: EventsHash|undefined;

        private static triggerEvents(events: EventCallback<any>[], ...args: any[]) {
            let ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
            switch (args.length) {
                case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
                case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
                case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
                case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
                default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
            }
        }

        on(name: string, callback: (ctx: any, ...args: any[]) => void, context?: any): this {
            this._events || (this._events = {});
            let events = this._events[name] || (this._events[name] = []);
            events.push({callback: callback, context: context, ctx: context || this});
            return this;
        }

        // Bind an event to only be triggered a single time. After the first time
        // the callback is invoked, it will be removed.
        once(name: string, callback: (ctx: any, ...args: any[]) => void, context?: any): this {
            var onceEv = once((...args: any[]) => {
                this.off(name, onceEv);
                callback.apply(this, args);
            });
            set(onceEv, '_callback', callback);
            return this.on(name, onceEv, context);
        }

        // Remove one or many callbacks. If `context` is null, removes all
        // callbacks with that function. If `callback` is null, removes all
        // callbacks for the event. If `name` is null, removes all bound
        // callbacks for all events.
        off(name: string, callback: (ctx: any, ...args: any[]) => void, context?: any): this {
            var retain, ev, events, names, i, l, j, k;
            if (!name && !callback && !context) {
                this._events = void 0;
                return this;
            }
            names = name ? [name] : keys(this._events);
            each(names, name => {
                if (this._events && (events = this._events[name])) {
                    this._events[name] = retain = [];
                    if (callback || context) {
                        for (j = 0, k = events.length; j < k; j++) {
                            ev = events[j];
                            if ((callback && callback !== ev.callback && callback !== get(ev.callback, '_callback')) ||
                                (context && context !== ev.context)) {
                                retain.push(ev);
                            }
                        }
                    }
                    if (!retain.length) delete this._events[name];
                }
            });

            return this;
        }

        trigger(name: string, ...args: any[]): this {
            if (!this._events) return this;
            // if (!eventsApi(this, 'trigger', name, args)) return this;
            let events = this._events[name];
            if (events) Eventable.triggerEvents(events, args);
            return this;
        }
    }

    export class Model<ATTRS> implements Eventable {
        private readonly __uid: string;
        private __attributes: ATTRS;

        constructor(attrs: Partial<ATTRS>) {
            this.__uid = 'm' + uniqueId();
            this.__attributes = <ATTRS> defaults({}, attrs, result<Partial<ATTRS>>(this, 'defaults'));
        }

        defaults(): Partial<ATTRS> {
            return {};
        }

        set<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY, value: ATTRS[ATTR_KEY], opts?: ModelFillOpts): this {
            // @ts-ignore
            this.fill({[attrName]: value});
            return this;
        }

        fill(attrs: Partial<ATTRS>, opts?: ModelFillOpts): this {
            let changes = [] as ({ a: keyof ATTRS, v: any })[];
            for (let attr in attrs) {
                if (!isEqual(this.__attributes[attr], attrs[attr])) {
                    changes.push({a: attr, v: attrs[attr]});
                    this.__attributes[attr] = <any> attrs[attr];
                }
            }

            if (!opts || !opts.silent) {
                each(changes, (change) => this.triggerAttrChanged(change.a, this, change.v))
            }

            return this;
        }

        get<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY): ATTRS[ATTR_KEY] {
            return this.__attributes[attrName];
        }

        has<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY): boolean {
            return this.get(attrName) != null;
        }

        onAttrChanged<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY, callback: (ctx: any, ...args: any[]) => void, context?: any) {
            this.onAttrsChanged([attrName], callback, context);
        }

        onAttrsChanged<ATTR_KEY extends keyof ATTRS>(attrNames: ATTR_KEY[], callback: (ctx: any, ...args: any[]) => void, context?: any) {
            each(attrNames, attrName => this.on("changed:"+attrName, callback, context));
        }

        onceAttrChanged<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY, callback: (ctx: any, ...args: any[]) => void, context?: any) {
            this.onceAttrsChanged([attrName], callback, context);
        }

        onceAttrsChanged<ATTR_KEY extends keyof ATTRS>(attrNames: ATTR_KEY[], callback: (ctx: any, ...args: any[]) => void, context?: any) {
            each(attrNames, attrName => this.once("changed:"+attrName, callback, context));
        }

        triggerAttrChanged<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY, model: this, value: ATTRS[ATTR_KEY]) {
            this.trigger('changed:' + attrName, model, value);
        }

        toJSON(): ATTRS {
            return clone(this.__attributes);
        }

        // Implemented through Mixins
        on!: (name: string, callback: (ctx: any, ...args: any[]) => void, context?: any) => this;
        once!: (name: string, callback: (ctx: any, ...args: any[]) => void, context?: any) => this;
        off!: (name: string, callback: (ctx: any, ...args: any[]) => void, context?: any) => this;
        trigger!: (name: string, ...args: any[]) => this;
        _events!: EventsHash;
    }
    applyMixins(Model, [Eventable]);
}