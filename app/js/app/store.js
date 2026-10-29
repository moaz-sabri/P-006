import { withTx } from "../data/db.js";
import { metaRepo } from "../data/meta.repo.js";
import { bus } from "./bus.js";

export const DEFAULT_SETTINGS = Object.freeze({
    language: null,
    keepAwake: true,
    haptics: true,
    sound: true,
    notify: true,
    lastBackup: null
});

let state = {
    ready: false,
    settings: { ...DEFAULT_SETTINGS },
    ui: { updateAvailable: false }
};

const subs = new Set();

export const store = {
    getState: () => state,

    setState(p) {
        state = { ...state, ...p };
        for (const s of [...subs]) {
            const v = s.sel(state);
            if (v !== s.last) {
                s.last = v;
                s.fn(v);
            }
        }
    },

    subscribe(sel, fn) {
        const s = { sel, fn, last: sel(state) };
        subs.add(s);
        return () => subs.delete(s);
    },

    async refresh(slice = "all") {
        if (slice === "settings") {
            await this.refreshSettings();
            return;
        }
        const data = await withTx(["meta"], "readonly", async r => {
            const meta = r.meta;
            const stored = (await metaRepo(meta).get("settings"))?.value || null;
            const lastBackup = (await metaRepo(meta).get("lastBackup"))?.value ?? null;
            return { ...DEFAULT_SETTINGS, ...(stored || {}), lastBackup };
        });
        this.setState({ settings: data });
    },

    async refreshSettings() {
        const data = await withTx(["meta"], "readonly", async r => {
            const meta = r.meta;
            const stored = (await metaRepo(meta).get("settings"))?.value || {};
            const lastBackup = (await metaRepo(meta).get("lastBackup"))?.value ?? null;
            return { ...DEFAULT_SETTINGS, ...state.settings, ...stored, lastBackup };
        });
        this.setState({ settings: data });
    },

    async saveSettings(patch) {
        const merged = { ...DEFAULT_SETTINGS, ...state.settings, ...patch };
        await withTx(["meta"], "readwrite", async r => {
            const { lastBackup, ...value } = merged;
            await metaRepo(r.meta).set("settings", value);
        });
        this.setState({ settings: merged });
    },

    init() {
        if (store.initialised) return;
        store.initialised = true;
        bus.on("data-changed", () => { store.refresh("all").catch(() => {}); });
    }
};
