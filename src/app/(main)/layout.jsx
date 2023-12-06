import SidebarMenu from "./components/LayoutComponents/SidebarMenu";
import BottombarMenu from "./components/LayoutComponents/BottombarMenu";
import { Suspense } from "react";
import Loading from "../loading";
import { getServerSession } from "next-auth";
import { nextAuthOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

const AppLayout = async ({ children }) => {
  const session = await getServerSession(nextAuthOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="flex flex-col lg:flex-row min-h-screen antialiased text-white bg-zinc-900 ">
        <SidebarMenu />
        <main className="flex-1">
          <div className="flex flex-col flex-1 min-h-screen p-4 overflow-x-hidden overflow-y-auto  lg:pl-72">
            {children}
            <BottombarMenu />
          </div>
        </main>
      </div>
    </Suspense>
  );
};

export default AppLayout;
