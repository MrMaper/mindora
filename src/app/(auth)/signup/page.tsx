import { redirect } from "next/navigation";

/** Deep-link alias — the animated shell lives on /login. */
export default function SignupPage() {
  redirect("/login?mode=signup");
}
