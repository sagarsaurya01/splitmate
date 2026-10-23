// In-memory data layer for Milestone 0. Function signatures match the future
// Supabase layer, so replica-backend can swap the body without touching screens.
import { splitEqually, Share, sharesBalance } from "./money";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  defaultCurrency: string;
};
export type Group = {
  id: string;
  name: string;
  groupType: string;
  memberIds: string[];
  createdBy: string;
};
export type Expense = {
  id: string;
  groupId: string | null;
  description: string;
  amountMinor: number;
  currencyCode: string;
  spentAt: string;
  isPayment: boolean;
  createdBy: string;
  shares: Share[];
};

type DB = { users: User[]; groups: Group[]; expenses: Expense[] };

// module-level singleton (survives across requests in the dev server process)
const g = globalThis as unknown as { __db?: DB };
function seed(): DB {
  const users: User[] = [
    { id: "u1", firstName: "Sagar", lastName: "Pathak", email: "sagar@demo.in", defaultCurrency: "INR" },
    { id: "u2", firstName: "Anjali", lastName: "Laddha", email: "anjali@demo.in", defaultCurrency: "INR" },
    { id: "u3", firstName: "Ajay", lastName: "Laddha", email: "ajay@demo.in", defaultCurrency: "INR" },
  ];
  const groups: Group[] = [
    { id: "gr1", name: "Goa Trip", groupType: "trip", memberIds: ["u1", "u2", "u3"], createdBy: "u1" },
  ];
  // one seeded equal-split expense: Sagar paid 3000 for dinner, split 3 ways
  const parts = splitEqually(300000, 3);
  const expenses: Expense[] = [
    {
      id: "ex1",
      groupId: "gr1",
      description: "Dinner at the beach shack",
      amountMinor: 300000,
      currencyCode: "INR",
      spentAt: "2026-10-20",
      isPayment: false,
      createdBy: "u1",
      shares: [
        { userId: "u1", paidMinor: 300000, owedMinor: parts[0] },
        { userId: "u2", paidMinor: 0, owedMinor: parts[1] },
        { userId: "u3", paidMinor: 0, owedMinor: parts[2] },
      ],
    },
  ];
  return { users, groups, expenses };
}
function db(): DB {
  if (!g.__db) g.__db = seed();
  return g.__db;
}

let idc = 1000;
const newId = (p: string) => `${p}${++idc}`;

// ---- reads ----
export function getUsers() {
  return db().users;
}
export function getUser(id: string) {
  return db().users.find((u) => u.id === id) ?? null;
}
export function getGroupsForUser(userId: string) {
  return db().groups.filter((gr) => gr.memberIds.includes(userId));
}
export function getGroup(id: string) {
  return db().groups.find((gr) => gr.id === id) ?? null;
}
export function getExpensesForGroup(groupId: string) {
  return db()
    .expenses.filter((e) => e.groupId === groupId)
    .sort((a, b) => b.spentAt.localeCompare(a.spentAt));
}

// ---- writes ----
export function createGroup(name: string, groupType: string, memberIds: string[], createdBy: string) {
  const gr: Group = { id: newId("gr"), name, groupType, memberIds, createdBy };
  db().groups.push(gr);
  return gr;
}

export function createEqualExpense(input: {
  groupId: string;
  description: string;
  amountMinor: number;
  payerId: string;
  participantIds: string[];
  currencyCode?: string;
  spentAt?: string;
}) {
  const parts = splitEqually(input.amountMinor, input.participantIds.length);
  const shares: Share[] = input.participantIds.map((uid, i) => ({
    userId: uid,
    paidMinor: uid === input.payerId ? input.amountMinor : 0,
    owedMinor: parts[i],
  }));
  const err = sharesBalance(input.amountMinor, shares);
  if (err) throw new Error(err);
  const e: Expense = {
    id: newId("ex"),
    groupId: input.groupId,
    description: input.description,
    amountMinor: input.amountMinor,
    currencyCode: input.currencyCode ?? "INR",
    spentAt: input.spentAt ?? new Date().toISOString().slice(0, 10),
    isPayment: false,
    createdBy: input.payerId,
    shares,
  };
  db().expenses.push(e);
  return e;
}

// ---- derived balances ----
// Net per user across a set of expenses: positive => they are owed.
export function netByUser(expenses: Expense[]): Record<string, number> {
  const net: Record<string, number> = {};
  for (const e of expenses) {
    if (e.isPayment) {
      // handled the same way: payer paid, recipient owed
    }
    for (const s of e.shares) {
      net[s.userId] = (net[s.userId] ?? 0) + (s.paidMinor - s.owedMinor);
    }
  }
  return net;
}

// Debt simplification: greedily match biggest creditor to biggest debtor.
export type Debt = { from: string; to: string; amountMinor: number };
export function simplifyDebts(net: Record<string, number>): Debt[] {
  const creditors = Object.entries(net).filter(([, v]) => v > 0).map(([id, v]) => ({ id, v }));
  const debtors = Object.entries(net).filter(([, v]) => v < 0).map(([id, v]) => ({ id, v: -v }));
  creditors.sort((a, b) => b.v - a.v);
  debtors.sort((a, b) => b.v - a.v);
  const debts: Debt[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].v, creditors[j].v);
    if (pay > 0) debts.push({ from: debtors[i].id, to: creditors[j].id, amountMinor: pay });
    debtors[i].v -= pay;
    creditors[j].v -= pay;
    if (debtors[i].v === 0) i++;
    if (creditors[j].v === 0) j++;
  }
  return debts;
}

// Total a user owes / is owed across all their groups (for the dashboard).
export function userSummary(userId: string) {
  const groups = getGroupsForUser(userId);
  let owed = 0, owe = 0;
  const perGroup: { group: Group; net: number }[] = [];
  for (const gr of groups) {
    const net = netByUser(getExpensesForGroup(gr.id));
    const mine = net[userId] ?? 0;
    perGroup.push({ group: gr, net: mine });
    if (mine > 0) owed += mine;
    else owe += -mine;
  }
  return { owed, owe, perGroup };
}
