import { cookies } from "next/headers";
import { getUser } from "./data";

const COOKIE = "sw_uid";

export function currentUserId(): string | null {
  return cookies().get(COOKIE)?.value ?? null;
}
export function currentUser() {
  const id = currentUserId();
  return id ? getUser(id) : null;
}
export function setCurrentUser(id: string) {
  cookies().set(COOKIE, id, { httpOnly: true, path: "/", sameSite: "lax" });
}
export function clearCurrentUser() {
  cookies().delete(COOKIE);
}
