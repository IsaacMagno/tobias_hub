"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

import AchievementList from "./achievementList";
import AchivementActivitie from "./achivementActivitie";
import achievPoints from "/public/userstreak/achievPoints.svg";
import { useGlobalState } from "../../services/state";
import { useRouter } from "next/navigation";

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
  const [sumaryActivitie, setSumaryActivitie] = useState();
  const [showAchievements, setShowAchievements] = useState(false);

  const {
    globalState: { champion },
  } = useGlobalState();

  const router = useRouter();

  useEffect(() => {
    if (!champion) {
      router.push("/");
    }
  }, [champion]);

  return (
    <div className="grid grid-cols-4  min-h-screen bg-zinc-800 rounded-lg pb-16 lg:pb-0">
      <div className="col-span-full pt-12 lg:pt-0 lg:col-span-3 relative">
        <div className="min-w-full fixed inset-x-0 lg:absolute bg-zinc-800 px-4">
          <div className="flex flex-col items-center">
            <span className="font-extrabold text-2xl  p-3 flex items-center">
              <Image src={achievPoints} alt="achievPoints" className="w-10" />
              {champion && <p>{champion.achievementPoints}</p>}
            </span>
            {!sumary ? (
              <div>
                <div className="flex flex-col justify-center items-center min-h-[30rem]">
                  <h1 className="font-bold text-xl py-10">Selecione um tipo</h1>
                  <div className="flex gap-6 justify-center items-center">
                    <Image
                      src={achievementsCategory[0].icon}
                      width={0}
                      height={0}
                      className="w-10 lg:w-20 cursor-pointer hover:bg-green-400 rounded-full p-1"
                      onClick={() => {
                        setSumary("Destreza");
                        setShowAchievements(false);
                      }}
                    />
                    <Image
                      src={achievementsCategory[1].icon}
                      width={0}
                      height={0}
                      className="w-10 lg:w-20 cursor-pointer hover:bg-blue-400 rounded-full p-1"
                      onClick={() => {
                        setSumary("Força");
                        setShowAchievements(false);
                      }}
                    />
                    <Image
                      src={achievementsCategory[2].icon}
                      width={0}
                      height={0}
                      className="w-10 lg:w-20 cursor-pointer hover:bg-red-400 rounded-full p-1"
                      onClick={() => {
                        setSumary("Inteligência");
                        setShowAchievements(false);
                      }}
                    />
                    <Image
                      src={achievementsCategory[3].icon}
                      width={0}
                      height={0}
                      className="w-10 lg:w-20 cursor-pointer hover:bg-yellow-400 rounded-full p-1"
                      onClick={() => {
                        setSumary("Constituição");
                        setShowAchievements(false);
                      }}
                    />
                    <Image
                      src={achievementsCategory[4].icon}
                      width={0}
                      height={0}
                      className="w-10 lg:w-20 cursor-pointer hover:bg-purple-600 rounded-full p-1"
                      onClick={() => {
                        setSumary("Sabedoria");
                        setShowAchievements(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <div className="mb-2">
            {sumary ? (
              <AchivementActivitie
                sumary={sumary}
                setSumaryActivitie={setSumaryActivitie}
                setShowAchievements={setShowAchievements}
              />
            ) : null}
          </div>
        </div>
        {showAchievements && (
          <AchievementList
            sumaryActivitie={sumaryActivitie}
            champion={champion}
          />
        )}
      </div>
      <div className="fixed top-0 inset-x-0 col-span-full border-b lg:border-none lg:static lg:top-auto lg:inset-x-auto lg:col-span-1 text-right bg-zinc-700 lg:rounded-r-lg p-2 ">
        <ul className="flex lg:flex-col gap-2">
          <li
            className="p-3 rounded-lg cursor-pointer hover:bg-zinc-800 bg-zinc-600  font-extrabold text-sm lg:text-xl flex items-center lg:block"
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
