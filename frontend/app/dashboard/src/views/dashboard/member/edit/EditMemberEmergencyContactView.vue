<template>
    <div id="parent-view" class="st-view">
        <STNavigationBar title="Noodcontact">
            <BackButton v-if="canPop" slot="left" @click="pop" />
            <button v-else slot="right" class="button icon gray close" @click="pop"></button>
        </STNavigationBar>
        
        <main>
            <h1>
                Gegevens van een reserve noodcontactpersoon
            </h1>

            <STErrorsDefault :error-box="errorBox" />
            <div class="split-inputs">
                <div>
                    <STInputBox title="Naam" error-fields="name" :error-box="errorBox">
                        <input v-model="name" class="input" nmae="name" type="text" placeholder="Naam" autocomplete="name">
                    </STInputBox>

                    <STInputBox title="Relatie" error-fields="title" :error-box="errorBox">
                        <input v-model="title" list="emergency-contact-types" class="input" name="type" type="text" placeholder="Vrije invoer (bv. oma)">
                        <datalist id="emergency-contact-types">
                            <option value="Oma" />
                            <option value="Opa" />
                            <option value="Tante" />
                            <option value="Oom" />
                            <option value="Buurvrouw" />
                            <option value="Buurman" />
                            <option value="Nonkel" />
                            <option value="Pepe" />
                            <option value="Meme" />
                            <option value="Grootvader" />
                            <option value="Grootmoeder" />
                        </datalist>
                    </STInputBox>
                </div>

                <div>
                    <PhoneInput title="GSM-nummer" v-model="phone" :validator="validator" placeholder="GSM-nummer" />
                </div>
            </div>
        </main>

        <STToolbar>
            <button  slot="right" class="button primary" @click="goNext">
                {{ !contact ? 'Toevoegen' : 'Opslaan' }}
            </button>
        </STToolbar>
    </div>
</template>

<script lang="ts">
import { isSimpleError, isSimpleErrors, SimpleError, SimpleErrors } from '@simonbackx/simple-errors';
import { Server } from "@simonbackx/simple-networking";
import { ComponentWithProperties, NavigationMixin } from "@simonbackx/vue-app-navigation";
import { ErrorBox, STErrorsDefault, STInputBox, STNavigationBar, STToolbar, AddressInput, Radio, PhoneInput, Checkbox, Validator, STList, STListItem, EmailInput, BackButton } from "@stamhoofd/components"
import { Address, Country, Organization, OrganizationMetaData, OrganizationType, Gender, MemberDetails, Parent, ParentType, ParentTypeHelper, EmergencyContact } from "@stamhoofd/structures"
import { Component, Mixins, Prop } from "vue-property-decorator";
import MemberParentsView from './MemberParentsView.vue';
import { FamilyManager } from '../../../../classes/FamilyManager';

@Component({
    components: {
        STToolbar,
        STNavigationBar,
        STErrorsDefault,
        STInputBox,
        AddressInput,
        Radio,
        PhoneInput,
        EmailInput,
        Checkbox,
        STList,
        STListItem,
        BackButton
    }
})
export default class EditMemberEmergencyContactView extends Mixins(NavigationMixin) {
    @Prop({ default: null })
    contact: EmergencyContact | null // tood

    @Prop({ required: true })
    familyManager: FamilyManager

    @Prop({ required: true })
    handler: (contact: EmergencyContact, component: EditMemberEmergencyContactView) => void;

    name = ""
    title = ""
    phone: string | null = null

    errorBox: ErrorBox | null = null
    validator = new Validator()

    mounted() {
        if (this.contact) {
            this.name = this.contact.name
            this.title = this.contact.title
            this.phone = this.contact.phone
        } else {
            const contact = this.familyManager.getEmergencyContact()
            if (contact) {
                this.name = contact.name
                this.title = contact.title
                this.phone = contact.phone
            }
        }
    }

    async goNext() {
        const errors = new SimpleErrors()
        if (this.name.length < 2) {
            errors.addError(new SimpleError({
                code: "invalid_field",
                message: "Vul de naam in",
                field: "name"
            }))
        }

        if (this.title.length < 2) {
            errors.addError(new SimpleError({
                code: "invalid_field",
                message: "Vul de relatie in",
                field: "title"
            }))
        }

        const valid = await this.validator.validate()

        if (errors.errors.length > 0) {
            this.errorBox = new ErrorBox(errors)
            return;
        } 
        
        if (!valid) {
            this.errorBox = null
            return;
        }

        if (this.contact) {
            this.contact.name = this.name
            this.contact.title = this.title
            this.contact.phone = this.phone
            this.handler(this.contact, this)
        } else {
            const contact = EmergencyContact.create({
                name: this.name,
                phone: this.phone,
                title: this.title
            })
            this.handler(contact, this)
        }
    }
}
</script>

<style lang="scss">
@use "@stamhoofd/scss/base/variables" as *;
@use "@stamhoofd/scss/base/text-styles" as *;

#parent-view {
    .address-selection {
        .middle {
            @extend .style-normal;
        }
    }
}
</style>
