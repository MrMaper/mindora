import { redirect } from "next/navigation";

/** Profile lives under Settings → Profile tab. */
export default function ProfilePage() {
  redirect("/settings?tab=profile");
}
