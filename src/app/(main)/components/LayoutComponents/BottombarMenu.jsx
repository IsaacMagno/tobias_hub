import React from "react";
import Image from "next/image";
import Link from "next/link";

import Logo from "/public/tobiasIcon.webp";

const BottombarMenu = () => {
  return (
    <div className="flex justify-center py-4  items-center h-12 w-full lg:hidden bg-zinc-900 fixed inset-x-0 bottom-0  z-50 lg:static lg:inset-auto lg:bottom-auto lg:z-auto box-content border-t">
      <Link
        href="/"
        className="w-[4rem] h-[4rem]  flex justify-center items-center rounded-full hover:cursor-pointer  box-border"
      >
        <Image
          className="w-[calc(50px-4px)] h-[calc(50px-4px)] rounded-full border-2  hover:border-white/20 "
          alt={"Tobias Logo"}
          src={Logo}
        />
      </Link>

      <ul className="flex ">
        <li className="box-border">
          <Link
            href={"/champions"}
            className="flex items-center flex-row  hover:bg-zinc-400 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/champions.svg"}
                width={50}
                height={50}
              />
            </div>
          </Link>
        </li>
        <li className="box-border">
          <Link
            href="/goals"
            className="flex items-center flex-row  hover:bg-zinc-400 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/tasks.svg"}
                width={50}
                height={50}
              />
            </div>
          </Link>
        </li>
        <li className="box-border">
          <Link
            href="/quests"
            className="flex items-center flex-row  hover:bg-zinc-400 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/quests.svg"}
                width={50}
                height={50}
              />
            </div>
          </Link>
        </li>
        <li className="box-border">
          <Link
            href="/achievements"
            className="flex items-center flex-row  hover:bg-zinc-400 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/achievments.svg"}
                width={50}
                height={50}
              />
            </div>
          </Link>
        </li>
        {/* <li className="box-border">
          <Link
            href="/shop"
            className="flex items-center flex-row  hover:bg-zinc-400 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/market.svg"}
                width={50}
                height={50}
              />
            </div>
          </Link>
        </li>
        <li className="box-border">
          <Link
            href="/tools"
            className="flex items-center flex-row  hover:bg-zinc-400 hover:bg-opacity-80 rounded-md hover:cursor-pointer"
          >
            <div className="p-1">
              <Image
                alt={"alt"}
                src={"/sidebarIcons/config.svg"}
                width={50}
                height={50}
              />
            </div>
          </Link>
        </li> */}
      </ul>
    </div>
  );
};

export default BottombarMenu;
