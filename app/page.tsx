import { redirect } from "next/navigation";
import { currentUserId } from "@/lib/session";

export default function Home() {
  redirect(currentUserId() ? "/dashboard" : "/login");
}
