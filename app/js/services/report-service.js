import { withTx } from "../data/db.js";
import { reader } from "../data/stores.js";
import { reportSummary, homeGlance } from "../domain/analytics.js";

const transactions = reader("transaction");
const debts = reader("debt");
const payments = reader("debtPayment");
const recurring = reader("recurring");

export const reportService = {
    async summary(period = "month", now = Date.now()) {
        const data = await withTx(
            ["transactions", "debts", "debtPayments", "recurring"],
            "readonly",
            async r => ({
                transactions: await transactions(r).getAll(),
                debts: await debts(r).getAll(),
                debtPayments: await payments(r).getAll(),
                recurring: await recurring(r).getAll()
            })
        );
        return reportSummary({
            transactions: data.transactions,
            debts: data.debts,
            debtPayments: data.debtPayments
        }, period, now);
    },

    async glance(now = Date.now()) {
        const data = await withTx(
            ["transactions", "recurring", "debts", "debtPayments"],
            "readonly",
            async r => ({
                transactions: await transactions(r).getAll(),
                recurring: await recurring(r).getAll(),
                debts: await debts(r).getAll(),
                debtPayments: await payments(r).getAll()
            })
        );
        return homeGlance(
            {
                transactions: data.transactions,
                recurring: data.recurring,
                debts: data.debts,
                debtPayments: data.debtPayments
            },
            now
        );
    }
};
