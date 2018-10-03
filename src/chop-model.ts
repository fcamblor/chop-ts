import {uniqueId, defaults, result, clone, isEqual} from "lodash";

export namespace Chop {
    export class Model<ATTRS> {
        private readonly __uid: string;
        private __attributes: ATTRS;

        constructor(attrs: Partial<ATTRS>) {
            this.__uid = 'm' + uniqueId();
            this.__attributes = <ATTRS> defaults({}, attrs, result<Partial<ATTRS>>(this, 'defaults'));
        }

        defaults(): Partial<ATTRS> {
            return {};
        }

        set<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY, value: ATTRS[ATTR_KEY]): this {
            // @ts-ignore
            this.fill({[attrName]: value});
            return this;
        }

        fill(attrs: Partial<ATTRS>): this {
            let changes = [] as ({ a: keyof ATTRS, v: any })[];
            for (let attr in attrs) {
                if (!isEqual(this.__attributes[attr], attrs[attr])) {
                    changes.push({a: attr, v: attrs[attr]});
                    this.__attributes[attr] = <any> attrs[attr];
                }
            }

            return this;
        }

        get<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY): ATTRS[ATTR_KEY] {
            return this.__attributes[attrName];
        }

        has<ATTR_KEY extends keyof ATTRS>(attrName: ATTR_KEY): boolean {
            return this.get(attrName) != null;
        }

        toJSON(): ATTRS {
            return clone(this.__attributes);
        }
    }
}