import { Parent } from "../Parent";
import { ParentType } from "../ParentType";
import { AddressFactory } from "./AddressFactory";
import { Factory } from "./Factory";
interface Options {
    type: ParentType | null;
}
import { Gender } from "../Gender";

export class ParentFactory extends Factory<Parent> {
    options: Options;

    constructor(options: Options) {
        super(options);
        this.options = options;
    }

    create(): Parent {
        const parent = new Parent();
        parent.type = this.options.type ?? this.randomArray(Object.keys(ParentType));
        if (parent.type == ParentType.Other) {
            // Second spin
            parent.type = this.options.type ?? this.randomArray(Object.keys(ParentType));
        }

        parent.firstName = this.randomFirstName(parent.type == ParentType.Mother ? Gender.Female : Gender.Male);
        parent.lastName = this.randomLastName();

        parent.address = new AddressFactory({}).create();
        parent.phone =
            "+32 47" +
            Math.floor(Math.random() * 10) +
            " " +
            Math.floor(Math.random() * 10) +
            Math.floor(Math.random() * 10) +
            " " +
            Math.floor(Math.random() * 10) +
            Math.floor(Math.random() * 10) +
            " " +
            Math.floor(Math.random() * 10) +
            Math.floor(Math.random() * 10);

        parent.mail =
            (Math.random() >= 0.5 ? parent.firstName.toLowerCase() : parent.firstName.toLowerCase()[0]) +
            (Math.random() >= 0.5 ? "." : Math.random() >= 0.5 ? "_" : "") +
            parent.lastName.toLowerCase().replace(" ", "") +
            "@" +
            this.randomArray([
                "hotmail.com",
                "outlook.com",
                "telenet.be",
                "proximus.be",
                "live.com",
                "gmail.com",
                "icloud.com",
            ]);
        return parent;
    }
}
