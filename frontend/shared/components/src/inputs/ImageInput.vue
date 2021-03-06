<template>
    <STInputBox :title="title" error-fields="*" :error-box="errorBox">
        <label class="image-input-box" :class="{square: isSquare}" @click="onClick">
            <span class="icon trash" v-if="!required && value" />

            <Spinner v-if="uploading" />
            <span class="icon upload" v-else-if="value == null"/>
            <img :src="src" v-else/>
            <input type="file" class="file-upload" accept="image/png, image/jpeg, image/svg+xml" @change="changedFile">
        </label>
    </STInputBox>
</template>

<script lang="ts">
import { ComponentWithProperties, NavigationMixin } from '@simonbackx/vue-app-navigation';
import { Formatter } from "@stamhoofd/utility"
import { Component, Mixins,Prop } from "vue-property-decorator";
import { Image, ResolutionRequest, Version } from "@stamhoofd/structures";
import Spinner from "../Spinner.vue";
import DateSelectionView from '../overlays/DateSelectionView.vue';
import { SessionManager } from '@stamhoofd/networking';
import { ErrorBox, STInputBox, Validator } from "@stamhoofd/components"

@Component({
    components: {
        Spinner,
        STInputBox
    }
})
export default class ImageInput extends Mixins(NavigationMixin) {
    @Prop({ default: "" }) 
    title: string;

    @Prop({ default: null }) 
    validator: Validator | null

    @Prop({ default: null })
    resolutions: ResolutionRequest[] | null
    
    @Prop({ default: null })
    value: Image | null;

    @Prop({ default: true })
    required!: boolean

    errorBox: ErrorBox | null = null

    uploading = false

    get isSquare() {
        if (this.resolutions == null) {
            return false
        }
        return !!this.resolutions.find(r => r.width == r.height && r.width)
    }

    get src() {
        return this.value!.getPathForSize(undefined, 64)
    }

    onClick(event) {
        if (!this.required && this.value) {
            event.preventDefault();
            this.$emit("input", null)
        }
    }

    changedFile(event) {
        if (!event.target.files || event.target.files.length != 1) {
            return;
        }
        if (this.uploading) {
            return;
        }

        const file = event.target.files[0];
        const resolutions = this.resolutions ?? [ResolutionRequest.create({ height: 720 })]

        const formData = new FormData();
        formData.append("file", file);
        formData.append("resolutions", JSON.stringify(resolutions.map(r => r.encode({ version: Version }))))

        this.uploading = true;
        this.errorBox = null;

        SessionManager.currentSession!.authenticatedServer
            .request({
                method: "POST",
                path: "/upload-image",
                body: formData,
                decoder: Image,
                timeout: 60*1000
            })
            .then(response => {
                this.$emit("input", response.data)
            })
            .catch(e => {
                console.error(e);
                this.errorBox = new ErrorBox(e)
            })
            .finally(() => {
                this.uploading = false;

                 // Clear selection
                event.target.value = null;
            });
    }
}
</script>

<style lang="scss">
@use "@stamhoofd/scss/base/variables.scss" as *;
@use "@stamhoofd/scss/base/text-styles.scss" as *;

.image-input-box {
    @extend .style-input;
    @extend .style-input-shadow;
    border: $border-width solid $color-gray-light;
    color: $color-gray;
    background: white;
    border-radius: $border-radius;
    padding: 5px 15px;
    height: 60px;
    margin: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.2s, color 0.2s;
    outline: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    cursor: pointer;
    touch-action: manipulation;
    position: relative;


    &:hover {
        border-color: $color-primary-gray-light;
        color: $color-primary;
    }

    &:active {
        border-color: $color-primary;
        color: $color-primary;
    }

    &.square {
        width: 60px;
    }

    .file-upload {
        display: none;
    }

    img {
        position: absolute; // fix max width
        max-height: 33px;
        max-width: 100%;
    }

    .icon.trash {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: rgba(white, 0.9);
        text-align: center;
        opacity: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        transition: opacity 0.2s;
    }

    &:hover {
        .icon.trash {
            opacity: 1;
        }
    }
}

</style>
