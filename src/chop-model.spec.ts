import {Chop} from './chop-model';

describe("chop-model", () => {
    it("typesafe instanciation", () => {
        let model = new Chop.Model({ aString: "str", anInt: 123, anObj: { a: 'a', b: 'b' } });

        let str: string = model.get('aString');
        let num: number = model.get('anInt');
        let obj: {a:string, b:string} = model.get('anObj');

        console.log(str, num, obj);
    });
});