import { transactionsRepo } from "./transactions.repo.js";
import { recurringRepo } from "./recurring.repo.js";
import { debtsRepo } from "./debts.repo.js";
import { debtPaymentsRepo } from "./debt-payments.repo.js";
import { categoriesRepo } from "./categories.repo.js";
import { peopleRepo } from "./people.repo.js";
import { ValidationError } from "../domain/errors.js";
import {
    MAX_FINANCE_TRANSACTIONS,
    MAX_FINANCE_RECURRING,
    MAX_FINANCE_DEBTS,
    MAX_FINANCE_DEBT_PAYMENTS,
    MAX_FINANCE_CATEGORIES,
    MAX_FINANCE_PEOPLE
} from "../domain/validation.js";

export const RECORDS = Object.freeze([
    {
        type: "transaction",
        store: "transactions",
        backupKey: "financeTransactions",
        repo: transactionsRepo,
        quota: { field: "transactions", max: MAX_FINANCE_TRANSACTIONS, code: "finance_limit" }
    },
    {
        type: "recurring",
        store: "recurring",
        backupKey: "financeRecurring",
        repo: recurringRepo,
        quota: { field: "recurring", max: MAX_FINANCE_RECURRING, code: "finance_limit" }
    },
    {
        type: "debt",
        store: "debts",
        backupKey: "financeDebts",
        repo: debtsRepo,
        quota: { field: "debts", max: MAX_FINANCE_DEBTS, code: "finance_limit" }
    },
    {
        type: "debtPayment",
        store: "debtPayments",
        backupKey: "financeDebtPayments",
        repo: debtPaymentsRepo,
        quota: { field: "debtPayments", max: MAX_FINANCE_DEBT_PAYMENTS, code: "finance_limit" }
    },
    {
        type: "category",
        store: "categories",
        backupKey: "financeCategories",
        repo: categoriesRepo,
        quota: { field: "categories", max: MAX_FINANCE_CATEGORIES, code: "finance_limit" }
    },
    {
        type: "person",
        store: "people",
        backupKey: "financePeople",
        repo: peopleRepo,
        quota: { field: "people", max: MAX_FINANCE_PEOPLE, code: "finance_limit" }
    }
]);

export const LOCAL_STORES = Object.freeze(["meta", "outbox"]);

const localRepos = new Map();

export function localReader(store) {
    const repo = localRepos.get(store);
    if (!repo) throw new Error(`no local repo for store: ${store}`);
    return r => repo(r[store]);
}

export const VOCABULARY_TYPES = Object.freeze(["category", "person"]);

const byType = new Map(RECORDS.map(r => [r.type, r]));
const byName = new Map(RECORDS.flatMap(r => [[r.type, r], [r.store, r]]));

export const SYNC_TYPES = Object.freeze(RECORDS.map(r => r.type));
export const SYNCED_STORES = Object.freeze(Object.fromEntries(RECORDS.map(r => [r.type, r.store])));
export const BACKUP_STORES = Object.freeze(RECORDS.map(r => r.store));

export function recordFor(name) {
    return byName.get(name);
}

export function repoFor(name) {
    return byName.get(name)?.repo;
}

export function reader(type) {
    const record = byName.get(type);
    if (!record) throw new Error(`unknown record type: ${type}`);
    return r => record.repo(r[record.store]);
}

export async function guardQuota(r, type) {
    const record = byName.get(type);
    if (!record) throw new Error(`unknown record type: ${type}`);
    if (!record.quota) return;
    const { field, max, code } = record.quota;
    if (await record.repo(r[record.store]).count() >= max) {
        throw new ValidationError(field, code);
    }
}
