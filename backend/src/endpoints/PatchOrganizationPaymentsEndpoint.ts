import { Database, ManyToOneRelation,OneToManyRelation } from '@simonbackx/simple-database';
import { ArrayDecoder, Decoder } from '@simonbackx/simple-encoding';
import { DecodedRequest, Endpoint, Request, Response } from "@simonbackx/simple-endpoints";
import { SimpleError } from "@simonbackx/simple-errors";
import { EncryptedMember,EncryptedPaymentDetailed, PaymentPatch,PaymentStatus,RegistrationWithEncryptedMember } from "@stamhoofd/structures";

import { Member } from '../models/Member';
import { Payment } from '../models/Payment';
import { Registration } from '../models/Registration';
import { Token } from '../models/Token';
type Params = {};
type Query = undefined;
type Body = PaymentPatch[]
type ResponseBody = EncryptedPaymentDetailed[]

type RegistrationWithMember = Registration & { member: Member}
type PaymentWithRegistrations = Payment & { registrations: RegistrationWithMember[] }

/**
 * One endpoint to create, patch and delete groups. Usefull because on organization setup, we need to create multiple groups at once. Also, sometimes we need to link values and update multiple groups at once
 */

export class PatchOrganizationPaymentsEndpoint extends Endpoint<Params, Query, Body, ResponseBody> {
    bodyDecoder = new ArrayDecoder(PaymentPatch as Decoder<PaymentPatch>)
    protected doesMatch(request: Request): [true, Params] | [false] {
        if (request.method != "PATCH") {
            return [false];
        }

        const params = Endpoint.parseParameters(request.url, "/organization/payments", {});

        if (params) {
            return [true, params as Params];
        }
        return [false];
    }

    async handle(request: DecodedRequest<Params, Query, Body>) {
        const token = await Token.authenticate(request);
        const user = token.user

        // If the user has permission, we'll also search if he has access to the organization's key
        if (!user.permissions || !user.permissions.hasFullAccess()) {
            throw new SimpleError({
                code: "permission_denied",
                message: "You don't have permissions to access payments",
                human: "Je hebt geen toegang tot betalingen"
            })
        }

        const payments = await this.getPaymentsWithRegistrations(user.organizationId)


        // Modify payments
        for (const patch of request.body) {
            const model = payments.find(p => p.id == patch.id)
            if (!model) {
                throw new SimpleError({
                    code: "payment_not_found",
                    message: "Payment with id "+patch.id+" does not exist"
                })
            }
            if (patch.status) {
                if (model.status != PaymentStatus.Succeeded && model.paidAt === null && patch.status == PaymentStatus.Succeeded) {
                    model.paidAt = new Date()
                } else if (model.paidAt !== null && patch.status != PaymentStatus.Succeeded) {
                    model.paidAt = null
                }

                model.status = patch.status
            }

        }

        for (const payment of payments) {
            // Automatically checks if it is changed or not
            await payment.save()
        }

        return new Response(payments.map(p => {
            return EncryptedPaymentDetailed.create({
                id: p.id,
                method: p.method,
                status: p.status,
                price: p.price,
                transferDescription: p.transferDescription,
                paidAt: p.paidAt,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
                registrations: p.registrations.map(r => RegistrationWithEncryptedMember.create({
                    id: r.id,
                    groupId: r.groupId,
                    cycle: r.cycle,
                    registeredAt: r.registeredAt,
                    deactivatedAt: r.deactivatedAt,
                    createdAt: r.createdAt,
                    updatedAt: r.updatedAt,
                    member: EncryptedMember.create(r.member)
                }))
            })
        }));
    }

    /**
     * Fetch all members with their corresponding (valid) registrations and payment
     */
    async getPaymentsWithRegistrations(organizationId: string): Promise<PaymentWithRegistrations[]> {
        let query = `SELECT ${Payment.getDefaultSelect()}, ${Registration.getDefaultSelect()}, ${Member.getDefaultSelect()} from \`${Payment.table}\`\n`;
        query += `JOIN \`${Registration.table}\` ON \`${Registration.table}\`.\`${Registration.payment.foreignKey}\` = \`${Payment.table}\`.\`${Payment.primary.name}\` AND \`${Registration.table}\`.\`registeredAt\` is not null\n`
        query += `JOIN \`${Member.table}\` ON \`${Registration.table}\`.\`${Member.registrations.foreignKey}\` = \`${Member.table}\`.\`${Member.primary.name}\`\n`
        query += `where \`${Member.table}\`.\`organizationId\` = ?`

        const [results] = await Database.select(query, [organizationId])
        const payments: PaymentWithRegistrations[] = []

        // In the future we might add a 'reverse' method on manytoone relation, instead of defining the new relation. But then we need to store 2 model types in the many to one relation.
        const paymentRegistrationsRelation = new OneToManyRelation(Payment, Registration, "registrations", Registration.payment.foreignKey as keyof Registration)
        const registrationMemberRelation = new ManyToOneRelation(Member, "member")
        registrationMemberRelation.foreignKey = Member.registrations.foreignKey

        for (const row of results) {
            const foundPayment = Payment.fromRow(row[Payment.table])
            if (!foundPayment) {
                throw new Error("Expected payment in every row")
            }
            const _f = foundPayment.setManyRelation(paymentRegistrationsRelation, []) as PaymentWithRegistrations

            // Seach if we already got this member?
            const existingPayment = payments.find(m => m.id == _f.id)

            const payment: PaymentWithRegistrations = (existingPayment ?? _f)
            if (!existingPayment) {
                payments.push(payment)
            }

            // Check if we have a registration with a member
            const registration = Registration.fromRow(row[Registration.table])
            if (registration) {
                const member = Member.fromRow(row[Member.table])
                if (!member) {
                    throw new Error("Every registration should have a valid member")
                }

                const regWithMember: RegistrationWithMember = registration.setRelation(registrationMemberRelation, member)
                payment.registrations.push(regWithMember)
            }
        }

        return payments

    }
}
