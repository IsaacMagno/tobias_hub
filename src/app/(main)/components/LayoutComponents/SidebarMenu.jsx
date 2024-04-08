import React from "react";
import Image from "next/image";
import Link from "next/link";

import Logo from "/public/tobiasIcon.webp";

const SidebarMenu = () => {
  return (
    <aside className="hidden lg:block fixed inset-y-0 z-10 flex-shrink-0 w-64 focus:outline-none p-2 space-y-2 border-r-2 bg-zinc-950">
      <div className="w-full flex flex-col justify-center items-center my-6">
        <Link href={"/"}>
          <span className=" w-[9.5rem] h-[9.5rem] bg-white flex justify-center items-center rounded-full">
            <Image
              className="w-[calc(150px-4px)] h-[calc(150px-4px)] rounded-full"
              alt={"Tobias Logo"}
              src={Logo}
            />
          </span>
        </Link>
      </div>

      <ul className="list-none">
        <li>
          <Link
            href={"/champions"}
            className="flex items-center flex-row px-1 py-2 hover:bg-stone-700 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/champions.svg"}
                width={40}
                height={40}
              />
            </div>
            <span className="sidebar-button-text">Campeões</span>
          </Link>
        </li>
        <li>
          <Link
            href="/goals"
            className="flex items-center flex-row px-1 py-2 hover:bg-stone-700 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/tasks.svg"}
                width={40}
                height={40}
              />
            </div>
            <span className="sidebar-button-text">Metas</span>
          </Link>
        </li>
        <li>
          <Link
            href="/quests"
            className="flex items-center flex-row px-1 py-2 hover:bg-stone-700 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/quests.svg"}
                width={40}
                height={40}
              />
            </div>
            <span className="sidebar-button-text">Missões</span>
          </Link>
        </li>
        <li>
          <Link
            href="/achievements"
            className="flex items-center flex-row px-1 py-2 hover:bg-stone-700 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/achievments.svg"}
                width={40}
                height={40}
              />
            </div>
            <span className="sidebar-button-text">Conquistas</span>
          </Link>
        </li>
        {/* <li>
          <Link
            href="/shop"
            className="flex items-center flex-row px-1 py-2 hover:bg-stone-700 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/market.svg"}
                width={40}
                height={40}
              />
            </div>
            <span className="sidebar-button-text">Loja</span>
          </Link>
        </li>
        <li>
          <Link
            href="/tools"
            className="flex items-center flex-row px-1 py-2 hover:bg-stone-700 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div>
              <Image
                alt={"alt"}
                src={"/sidebarIcons/config.svg"}
                width={40}
                height={40}
              />
            </div>
            <span className="sidebar-button-text">Ferramentas</span>
          </Link>
        </li> */}
      </ul>
    </aside>
  );
};

export default SidebarMenu;
