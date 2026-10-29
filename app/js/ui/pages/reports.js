import { h } from "../dom.js";
import { t } from "../../i18n/i18n.js";
import { reportService } from "../../services/report-service.js";
import { formatMoney, formatSignedMoney } from "../../domain/money.js";
import { REPORT_PERIODS } from "../../domain/analytics.js";
import {
    page,
    pageHead,
    cardGrid,
    card,
    sectionTitle,
    statGrid,
    stat,
    list,
    listRow
} from "../components/ui.js";
import { selectControl, caption } from "../components/fields.js";

export const reportsPage = {
    title: () => t("reports.title"),

    async mount(root) {
        const body = h("div", { class: "card-grid" });
        let period = "month";
        const { select, element } = selectControl({
            options: REPORT_PERIODS.map(p => ({ value: p, label: t(`reports.period_${p}`) })),
            value: period,
            ariaLabel: t("reports.period")
        });
        select.addEventListener("change", () => {
            period = select.value;
            this.render(body, period);
        });
        root.append(page(
            pageHead({
                title: t("reports.title"),
                icon: "chart",
                actions: h("label", { class: "head-filter" }, caption(t("reports.period")), element)
            }),
            body
        ));
        await this.render(body, period);
    },

    async render(body, period) {
        const summary = await reportService.summary(period);
        const currency = summary.currency;
        body.replaceChildren(
            card(sectionTitle(t("home.money"), { icon: "Pocket" }), statGrid(
                stat({ label: t("home.monthExpenses"), value: formatMoney(summary.expenses, currency) }),
                stat({ label: t("home.monthIncome"), value: formatMoney(summary.income, currency) }),
                stat({ label: t("home.monthRemaining"), value: formatSignedMoney(summary.net, currency), tone: summary.net < 0 ? "danger" : "" }),
                stat({ label: t("finance.transactions"), value: summary.transactionCount ?? 0 })
            )),
            card(sectionTitle(t("nav.finance"), { icon: "Pocket" }), statGrid(
                stat({ label: t("home.monthDebts"), value: formatSignedMoney(summary.debts?.net ?? 0, currency) }),
                stat({ label: t("reports.openDebts"), value: summary.debts?.open ?? 0 })
            ))
        );
    }
};
