<template>
    <ComponentWithPropertiesInstance v-if="loggedIn" :key="root.key" :component="root" />
    <ComponentWithPropertiesInstance v-else-if="noPermissionsRoot && showPermissionsRoot" :key="noPermissionsRoot.key" :component="noPermissionsRoot" />
    <LoadingView v-else-if="hasToken" />
    <ComponentWithPropertiesInstance v-else :key="loginRoot.key" :component="loginRoot" />
</template>

<script lang="ts">
import { ComponentWithProperties, ComponentWithPropertiesInstance } from "@simonbackx/vue-app-navigation";
import {SessionManager} from "@stamhoofd/networking"
import { Component, Prop, Vue } from "vue-property-decorator";

import LoadingView from "./LoadingView.vue"

@Component({
    components: {
        ComponentWithPropertiesInstance,
        LoadingView
    },
})
export default class AuthenticatedView extends Vue {
    @Prop()
    root: ComponentWithProperties

    @Prop()
    loginRoot: ComponentWithProperties

    /**
     * Set this as the root when the user doesn't have permissions (don't set if permissions are not needed)
     */
    @Prop()
    noPermissionsRoot: ComponentWithProperties | null

    loggedIn = false
    hasToken = false
    showPermissionsRoot = false

    mounted() {
        this.changed();
        SessionManager.addListener(this, this.changed.bind(this));
    }

    activated() {
        this.changed();
        SessionManager.addListener(this, this.changed.bind(this));
    }

    deactivated() {
        SessionManager.removeListener(this);
    }

    destroyed() {
        SessionManager.removeListener(this);
    }

    changed() {
        if (this.noPermissionsRoot) {
            this.loggedIn = (SessionManager.currentSession?.isComplete() ?? false) && !!SessionManager.currentSession!.user && SessionManager.currentSession!.user.permissions != null
            this.hasToken = SessionManager.currentSession?.hasToken() ?? false
            this.showPermissionsRoot = SessionManager.currentSession?.isComplete() ?? false
        } else {
            this.loggedIn = SessionManager.currentSession?.isComplete() ?? false
            this.hasToken = SessionManager.currentSession?.hasToken() ?? false
            this.showPermissionsRoot = false
        }
        
        console.log("Authenticated view changed: "+this.loggedIn)
    }
}
</script>