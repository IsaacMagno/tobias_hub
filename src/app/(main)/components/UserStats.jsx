import React from "react";
import Image from "next/image";

import userStatsImage from "/public/userStats/stats.svg";
import Activities from "./Activities";

const userStats = ({ statistics, activities }) => {
  return (
    <section className="w-full h-full mt-4 pb-28 userstats-md userstats-lg bg-zinc-900">
      <div className="flex items-center justify-evenly gap-2">
        <Image src={userStatsImage} alt="user stats" className="w-10 h-10" />

        <h1 className="text-xl font-semibold my-4 ">Caracteristica</h1>
        <div></div>
      </div>

      <ul className="list-none space-y-2">
        <li>
          <span className="flex justify-between border-b">
            <span className="text-sm lg:text-[15px] font-medium flex gap-2">
              <p className="w-14">( STR )</p>
              <p>Força</p>
            </span>
            <p className="text-sm lg:text-[15px] font-bold opacity-80">
              {statistics.strength}
            </p>
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <span className="text-sm lg:text-[15px] font-medium flex gap-2">
              <p className="w-14">( DEX )</p>
              <p>Destreza</p>
            </span>
            <p className="text-sm lg:text-[15px] font-bold opacity-80">
              {statistics.agility}
            </p>
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <span className="text-sm lg:text-[15px] font-medium flex gap-2">
              <p className="w-14">( INT )</p>
              <p>Inteligência</p>
            </span>
            <p className="text-sm lg:text-[15px] font-bold opacity-80">
              {statistics.inteligence}
            </p>
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b ">
            <span className="text-sm lg:text-[15px] font-medium flex gap-2">
              <p className="w-14">( CON )</p>
              <p>Constituição</p>
            </span>
            <p className="text-sm lg:text-[15px] font-bold opacity-80">
              {statistics.vitality}
            </p>
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <span className="text-sm lg:text-[15px] font-medium flex gap-2">
              <p className="w-14">( WIS )</p>
              <p>Sabedoria</p>
            </span>
            <p className="text-sm lg:text-[15px] font-bold opacity-80">
              {statistics.wisdom}
            </p>
          </span>
        </li>
      </ul>

      <Activities activities={activities} />
    </section>
  );
};

export default userStats;
