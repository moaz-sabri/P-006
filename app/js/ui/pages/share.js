import { h } from "../dom.js";
import { t } from "../../i18n/i18n.js";
import { router } from "../../app/router.js";
import { peekShare, stashShare, takeShare, hasContent, hasToken, sharePrefill } from "../../app/share-payload.js";
import { MONEY_ICON_NAMES } from "../icons.js";
import { page, pageHead, card, sectionTitle, targetGrid, target, toolbar, action } from "../components/ui.js";

export const sharePage = {
    title: () => t("share.title"),

    async mount(root) {
        const payload = peekShare() ?? stashShare(readFromLocation());

        const preview = payload
            ? card(sectionTitle(t("share.shared"), { icon: "file" }), sharePrefill(payload, 400) ? h("p", { class: "share-preview-text" }, sharePrefill(payload, 400)) : null)
            : null;

        const grid = targetGrid([
            target({ name: t("share.addIncome"), hint: t("share.addIncomeHint"), icon: MONEY_ICON_NAMES.income, href: "/finance/transactions/new/income" }),
            target({ name: t("share.addExpense"), hint: t("share.addExpenseHint"), icon: MONEY_ICON_NAMES.expense, href: "/finance/transactions/new/expense" })
        ]);

        const discard = action({
            label: t("share.discard"),
            icon: "close",
            onClick: () => {
                const parked = takeShare();
                if (hasToken(parked)) releaseSharedShareSafe(parked.token);
                router.navigate("/");
            }
        });

        root.append(page(
            pageHead({ title: t("share.title"), icon: "link" }),
            h("p", { class: "muted" }, t("share.hint")),
            preview,
            grid,
            toolbar(discard)
        ));
    }
};

function readFromLocation() {
    if (typeof location === "undefined") return null;
    const params = new URLSearchParams(location.search);
    const raw = {
        url: (params.get("url") || "").trim(),
        text: (params.get("text") || "").trim(),
        title: (params.get("title") || "").trim(),
        token: (params.get("t") || "").trim()
    };
    return hasContent(raw) ? raw : null;
}

function releaseSharedShareSafe(token) {
    if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) return;
    try {
        fetch(`/api/share/intake?t=${encodeURIComponent(token)}`, { method: "DELETE", credentials: "omit", cache: "no-store", keepalive: true }).catch(() => {});
    } catch {}
}