import BoyNames from "./data/boys";
import GirlNames from "./data/girls";
import FamilyNames from "./data/family-names";
import { Gender } from '@/members/models/Gender';

export abstract class Factory<Options, Model> {
    options: Options;
    constructor(options: Options) {
        this.options = options;
    }
    abstract create(): Promise<Model>;

    randomArray(arr: Array<any>): any {
        const int = Math.floor(Math.random() * arr.length);
        return arr[int];
    }

    randomEnum<E extends { [key: number]: string | number }>(e: E): E[keyof E] {
        return this.randomArray(Object.values(e))
    }

    randomFirstName(gender: Gender): string {
        let names: string[]
        switch (gender) {
            case Gender.Male:
                names = BoyNames;
                break;
            case Gender.Female:
                names = GirlNames;
                break;
            case Gender.Other:
                names = [...BoyNames, ...GirlNames];
                break;
        }
        return this.randomArray(names);
    }

    randomLastName(): string {
        return this.randomArray(FamilyNames);
    }

    async createMultiple(amount = 40): Promise<Model[]> {
        const arr: Model[] = [];
        for (let index = 0; index < amount; index++) {
            arr.push(await this.create());
        }
        return arr;
    }
}
