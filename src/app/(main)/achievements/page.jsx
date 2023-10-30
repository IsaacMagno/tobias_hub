"use client";
import React, { useState } from "react";
import Image from "next/image";

import AchievementList from "./achievementList";
import achievPoints from "/public/userstreak/achievPoints.svg";

const achievementsCategory = [
  {
    name: "Destreza",
    icon: "/achievementIcons/air.svg",
  },
  {
    name: "Força",
    icon: "/achievementIcons/str.svg",
  },
  {
    name: "Inteligência",
    icon: "/achievementIcons/fire.svg",
  },
  {
    name: "Constituição",
    icon: "/achievementIcons/con.svg",
  },
  {
    name: "Sabedoria",
    icon: "/achievementIcons/wis.svg",
  },
];

const page = () => {
  const [sumary, setSumary] = useState("");
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <div className="grid grid-cols-4  min-h-screen bg-zinc-800 rounded-lg pb-16 lg:pb-0">
      <div className="col-span-full pt-12 lg:pt-0 lg:col-span-3 relative">
        <div className="min-w-full fixed inset-x-0 lg:absolute bg-zinc-800 px-4">
          <div className="flex justify-center">
            <span className="font-extrabold text-2xl  p-3 flex items-center">
              <Image src={achievPoints} alt="achievPoints" className="w-10" />
              <p>999999</p>
            </span>
          </div>
          <div className="mb-2">
            {sumary === "Destreza" ? (
              <ul className="bg-zinc-950 flex justify-between text-center p-2 rounded-lg font-extrabold ">
                <li
                  className="flex-grow py-2 lg:py-4 text-sm text-white/50 hover:text-white hover:bg-zinc-900 cursor-pointer rounded-lg"
                  onClick={() => setShowAchievements(!showAchievements)}
                >
                  Corrida
                </li>
                <li className="flex-grow py-2 lg:py-4 text-sm text-white/50 hover:text-white hover:bg-zinc-900 cursor-pointer rounded-lg">
                  Salto de corda
                </li>
                <li className="flex-grow py-2 lg:py-4 text-sm text-white/50 hover:text-white hover:bg-zinc-900 cursor-pointer rounded-lg">
                  Bike
                </li>
              </ul>
            ) : null}
          </div>
        </div>
        {showAchievements ? <AchievementList /> : null}
      </div>
      <div className="fixed top-0 inset-x-0 col-span-full border-b lg:border-none lg:static lg:top-auto lg:inset-x-auto lg:col-span-1 text-right bg-zinc-700 lg:rounded-r-lg p-2 ">
        <ul className="flex lg:flex-col gap-2">
          <li
            className="p-3 rounded-lg cursor-pointer hover:bg-zinc-800 bg-zinc-600  font-extrabold text-sm lg:text-xl "
            onClick={() => {
              setSumary("");
              setShowAchievements(false);
            }}
          >
            <p className="flex justify-center">Sumario</p>
          </li>
          {achievementsCategory.map((category, index) => (
            <li
              className="p-3 rounded-lg cursor-pointer bg-zinc-700 hover:bg-zinc-800 flex items-center justify-around  font-bold"
              key={index}
              onClick={() => {
                setSumary(category.name);
                setShowAchievements(false);
              }}
            >
              <Image
                src={category.icon}
                alt="categoryIcon"
                width={12}
                height={12}
                className="w-12"
              />
              <p className="hidden lg:block lg:w-24">{category.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default page;
