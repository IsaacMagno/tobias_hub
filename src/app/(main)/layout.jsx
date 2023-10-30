import SidebarMenu from "./components/LayoutComponents/SidebarMenu";
import BottombarMenu from "./components/LayoutComponents/BottombarMenu";

const AppLayout = ({ children }) => {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen antialiased text-white bg-zinc-900 ">
      <SidebarMenu />
      <main className="flex-1">
        <div className="flex flex-col flex-1 min-h-screen p-4 overflow-x-hidden overflow-y-auto  lg:pl-72">
          {children}
          <BottombarMenu />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
