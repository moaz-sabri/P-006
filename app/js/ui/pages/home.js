import { h } from "../dom.js";
import { t } from "../../i18n/i18n.js";
import { store } from "../../app/store.js";
import { MONEY_ICON_NAMES } from "../icons.js";
import { formatTime, formatDateLong } from "../../domain/time.js";
import { formatMoney, formatSignedMoney } from "../../domain/money.js";
import { reportService } from "../../services/report-service.js";
import { financeService } from "../../services/finance-service.js";
import { router } from "../../app/router.js";
import { checkBackupReminder } from "../../services/backup-reminder.js";
import {
    page,
    pageHead,
    pageSection,
    list,
    listRow,
    badge,
    action,
    stat,
    statPairs,
    card
} from "../components/ui.js";

export const home = {
    title: () => t("nav.home"),

    async mount(root) {
        try {
            const clockTime = h("span", { class: "home-clock-time number" });
            const clockDate = h("span", { class: "home-clock-date" });
            const clock = h("span", { class: "home-clock" },
                clockTime,
                h("span", { class: "home-clock-sep", "aria-hidden": "true" }, "\u00b7"),
                clockDate
            );

            const moneyBox = h("div", { class: "list" });
            const moneySection = pageSection({ title: t("home.money"), icon: "moneyIn", action: goTo("/finance"), body: moneyBox, hidden: true });
            const dueBox = h("div", { class: "list" });
            const dueSection = pageSection({ title: t("home.dueNow"), icon: "calendar", body: dueBox, hidden: true });
            const recentBox = h("div", { class: "list" });
            const recentSection = pageSection({ title: t("home.recent"), icon: "inbox", action: goTo("/finance/transactions"), body: recentBox, hidden: true });

            root.append(page(
                pageHead({ title: clock, icon: "home" }),
                moneySection,
                dueSection,
                recentSection
            ));

            this.stopClock = startClock(now => {
                clockTime.textContent = formatTime(now);
                clockDate.textContent = formatDateLong(now);
            });

            this.render(moneyBox, moneySection, dueBox, dueSection, recentBox, recentSection);
            checkBackupReminder();
        } catch (e) { console.error("home mount error", e && e.stack ? e.stack : e); }
    },

    async unmount() {
        this.stopClock?.();
        this.stopClock = null;
    },

    async render(moneyBox, moneySection, dueBox, dueSection, recentBox, recentSection) {
        try {
            let data = null;
            try { data = await reportService.glance(); } catch (e) { console.warn("home glance failed", e); return; }
            const money = data.money || {};
            const due = data.due || [];
            const recent = data.recent || [];

            // Money
            const income = money.income || 0;
            const expenses = money.expenses || 0;
            const net = money.net || 0;
            const currency = money.currency || null;
            const debts = money.debts || {};
            moneySection.hidden = !income && !expenses && !(debts.open);
            if (!moneySection.hidden) {
                moneyBox.replaceChildren(statPairs(
                    stat({ label: t("home.monthExpenses"), value: formatMoney(expenses, currency), icon: "moneyOut" }),
                    stat({ label: t("home.monthIncome"), value: formatMoney(income, currency), icon: "moneyIn" }),
                    stat({ label: t("home.monthRemaining"), value: formatSignedMoney(net, currency), icon: "scale", tone: net < 0 ? "danger" : "" })
                ));
            } else {
                moneyBox.replaceChildren();
            }

            // Due
            dueSection.hidden = due.length === 0;
            if (!dueSection.hidden) {
                dueBox.replaceChildren(list(...due.map(item => listRow({
                    href: `/finance/recurring/${item.id}`,
                    icon: MONEY_ICON_NAMES[item.type] ?? "Pocket",
                    title: item.title,
                    meta: [badge(formatMoney(item.amount, item.currency)), badge(item.late ? t("home.dueLate") : t("home.dueToday"), { icon: "calendar", tone: item.late ? "danger" : "" })]
                }))));
            } else {
                dueBox.replaceChildren();
            }

            // Recent transactions
            recentSection.hidden = recent.length === 0;
            if (!recentSection.hidden) {
                recentBox.replaceChildren(list(...recent.map(item => listRow({
                    href: item.kind === "transaction" ? `/finance/transactions/${item.id}` : null,
                    icon: "Pocket",
                    title: item.title || t("common.untitled"),
                    meta: [badge(formatTime(item.at), { icon: "clock" })]
                }))));
            } else {
                recentBox.replaceChildren();
            }
        } catch (e) { console.error("render home error", e && e.stack ? e.stack : e); }
    }
};

function goTo(href) {
    const label = t("nav.finance");
    return action({ label: null, icon: "chevronRight", href, title: label, ariaLabel: label });
}

function startClock(write) {
    let timer = null;
    const tick = () => {
        const now = Date.now();
        write(now);
        timer = setTimeout(tick, 60000 - (now % 60000) + 250);
    };
    tick();
    return () => clearTimeout(timer);
}