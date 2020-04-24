import { Organization } from "@stamhoofd-backend/app/src/organizations/models/Organization";
import { Request } from "@stamhoofd-backend/routing";
import { DecodedRequest } from "@stamhoofd-backend/routing";
import { Response } from "@stamhoofd-backend/routing";
import { Endpoint } from "@stamhoofd-backend/routing";

import { User } from "../models/User";
import { RegisterStruct } from "../structs/RegisterStruct";

type Params = {};
type Query = undefined;
type Body = RegisterStruct;
type ResponseBody = undefined;

export class RegisterEndpoint extends Endpoint<Params, Query, Body, ResponseBody> {
    protected bodyDecoder = RegisterStruct;

    protected doesMatch(request: Request): [true, Params] | [false] {
        if (request.method != "POST") {
            return [false];
        }

        const params = Endpoint.parseParameters(request.url, "/register", {});

        if (params) {
            return [true, params as Params];
        }
        return [false];
    }

    async handle(request: DecodedRequest<Params, Query, Body>) {
        const organization = await Organization.fromHost(request.host);
        const user = await User.register(
            organization,
            request.body.email,
            request.body.password,
            request.body.publicKey
        );
        if (!user) {
            // Todo: Send password recovery email with registration notice
            return new Response(undefined);
        }

        // An email has been send to confirm your email address
        return new Response(undefined);
    }
}