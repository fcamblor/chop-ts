import {Chop} from './chop-model';

describe("chop-model", () => {
    it("typesafe instanciation", () => {
        let model = new Chop.Model({ aString: "str", anInt: 123, anObj: { a: 'a', b: 'b' } });

        let str = model.get('aString');
        console.log(str.substring(0));

        let num = model.get('anInt');
        console.log(num.toFixed(0));

        let obj: {a:string, b:string} = model.get('anObj');

        // Doesn't compile : Argument of type "blah" is not assignable to parameter of type "aString" | "anInt" | "anObj"
        // let blah = model.get('blah');

        // Doesn't compile : Property 'toFixed' does not exist on type 'string'
        // It proves that we 'keep' JSON typing in our Chop.Model wrapper :-)
        // console.log(str.toFixed(0));

        // Doesn't compile : "type 'string' is not assignable to type 'number'"
        // let num2: number = model.get('aString');

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