import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthServerService } from "@/services/auth.server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Log In | Q-Tasks",
};

export default async function LoginPage() {
  const { status } = await AuthServerService.getMeServer();
  if (status === 200) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans selection:bg-blue-100 selection:text-blue-900">
      <LoginForm />
    </main>
  );
}
