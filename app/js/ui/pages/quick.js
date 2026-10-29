import { t } from "../../i18n/i18n.js";
import { router } from "../../app/router.js";
import { peekShare, sharePrefill } from "../../app/share-payload.js";
import { MONEY_ICON_NAMES } from "../icons.js";
import { toast } from "../components/toast.js";
import { openQuickTransaction } from "../components/finance-quick-add.js";
import { pageTall, pageHead, targetGrid, target, rowAction } from "../components/ui.js";

const DESTINATIONS = {
    income: "/finance/transactions/new/income",
    expense: "/finance/transactions/new/expense"
};

export const quickPage = {
    title: () => t("quick.title"),

    async mount(root) {
        const asked = new URLSearchParams(location.search).get("do");
        const parked = peekShare();

        if (asked === "income" || asked === "expense") {
            await run(asked, parked);
            return;
        }

        root.append(pageTall(
            pageHead({
                title: t("quick.title"),
                icon: "bolt",
                actions: [rowAction({ label: t("common.close"), icon: "close", onClick: () => router.navigate("/") })]
            }),
            targetGrid([
                target({ name: t("quick.addIncome"), icon: MONEY_ICON_NAMES.income, onClick: () => run("income", parked) }),
                target({ name: t("quick.addExpense"), icon: MONEY_ICON_NAMES.expense, onClick: () => run("expense", parked) })
            ], { fill: true })
        ));
    }
};

async function run(action, parked) {
    if (action === "income" || action === "expense") {
        const record = await openQuickTransaction({ type: action, title: sharePrefill(parked) || "" });
        if (record) router.refresh?.();
        return;
    }
    router.navigate(DESTINATIONS[action]);
}