"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setCurrentUser, clearCurrentUser, currentUserId } from "@/lib/session";
import { getUsers, createGroup, createEqualExpense, getGroup } from "@/lib/data";
import { toMinor } from "@/lib/money";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const user = getUsers().find((u) => u.email.toLowerCase() === email);
  if (!user) {
    redirect("/login?error=unknown");
  }
  setCurrentUser(user.id);
  redirect("/dashboard");
}

export async function signOutAction() {
  clearCurrentUser();
  redirect("/login");
}

export async function createGroupAction(formData: FormData) {
  const me = currentUserId();
  if (!me) redirect("/login");
  const name = String(formData.get("name") || "").trim();
  const groupType = String(formData.get("groupType") || "other");
  const memberIds = formData.getAll("memberIds").map(String);
  if (!memberIds.includes(me)) memberIds.push(me);
  if (!name) redirect("/groups?error=name");
  const gr = createGroup(name, groupType, memberIds, me);
  revalidatePath("/groups");
  redirect(`/groups/${gr.id}`);
}

export async function addExpenseAction(formData: FormData) {
  const me = currentUserId();
  if (!me) redirect("/login");
  const groupId = String(formData.get("groupId"));
  const gr = getGroup(groupId);
  if (!gr || !gr.memberIds.includes(me)) redirect("/groups");
  const description = String(formData.get("description") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const payerId = String(formData.get("payerId") || me);
  const participantIds = formData.getAll("participantIds").map(String);
  if (!description || amount <= 0 || participantIds.length === 0) {
    redirect(`/groups/${groupId}?error=input`);
  }
  createEqualExpense({
    groupId,
    description,
    amountMinor: toMinor(amount),
    payerId,
    participantIds,
  });
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}
