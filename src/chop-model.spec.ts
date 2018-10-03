import {Chop} from './chop-model';

describe("chop-model", () => {
    it("typesafe instanciation", () => {
        let model = new Chop.Model({ aString: "str", anInt: 123, anObj: { a: 'a', b: 'b' } });

        let str: string = model.get('aString');
        let num: number = model.get('anInt');
        let obj: {a:string, b:string} = model.get('anObj');

        console.log(str, num, obj);
    });

    it("events triggering", () => {
        let model = new Chop.Model({ aString: "str", anInt: 123, anObj: { a: 'a', b: 'b' } });

        let result = { status: 'failed', count: 0 };
        model.onAttrsChanged(["aString", "anInt", "anObj"], (ctx, changed) => {
            console.log("Field changed : "+JSON.stringify(ctx)+" => "+changed);
            result.status = 'success';
            result.count++;
        });

        model.set("aString", "blah");
        model.set("anInt", 123);

        expect(result.status).toEqual('success');
        expect(result.count).toEqual(1);

        model.set("anInt", 1234);
        expect(result.count).toEqual(2);
    });
});