export type ToastListener = (toast: Toast) => void

export class Toast {
    protected static listeners: Map<any, ToastListener> = new Map()
    message: string
    icon: string | null
    withOffset = false
    progress: number | null = null

    autohideAfter: number | null = 5000

    doHide: (() => void) | null = null

    constructor(message: string, icon: string | null = null) {
        this.message = message
        this.icon = icon
    }

    setProgress(progress: number | null) {
        this.progress = progress
        return this
    }

    setHide(ms: number | null) {
        this.autohideAfter = ms 
        return this
    }

    setWithOffset() {
        this.withOffset = true
        return this
    }

    static addListener(owner: any, listener: ToastListener) {
        this.listeners.set(owner, listener)
    }

    static removeListener(owner: any) {
        this.listeners.delete(owner)
    }

    static callListeners(toast: Toast) {
        for (const listener of this.listeners.values()) {
            listener(toast)
        }
    }

    show() {
        Toast.callListeners(this)
        return this
    }

    hide() {
        if (this.doHide) {
            this.doHide();
            this.doHide = null;
        }
        return this
    }
}