import SidebarMenu from "./components/LayoutComponents/SidebarMenu";
import BottombarMenu from "./components/LayoutComponents/BottombarMenu";
import { Suspense } from "react";
import Loading from "../loading";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import PomodoroShell from "@/components/pomodoro/PomodoroShell";
import TourProvider from "@/components/onboarding/TourProvider";

const AppLayout = async ({ children }) => {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<Loading />}>
      <PomodoroShell>
        <TourProvider>
          <div className="relative min-h-screen bg-ink-950 text-ash-200 bg-ink-radial">
            <SidebarMenu />
            <main className="min-h-screen lg:pl-60">
              <div className="mx-auto max-w-5xl px-4 pb-6 pt-14 sm:px-6 sm:pb-10 sm:pt-16">
                {children}
              </div>
              <BottombarMenu />
            </main>
          </div>
        </TourProvider>
      </PomodoroShell>
    </Suspense>
  );
};

export default AppLayout;
