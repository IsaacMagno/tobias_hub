"use client";
import React from "react";
import Image from "next/image";

import { AlarmClock } from "lucide-react";

import MonthChallenge from "/public/questsIcon/monthChallenge.svg";
import actualQuests from "/public/questsIcon/actualQuests.svg";
import MiniStatistics from "../components/LayoutComponents/MiniStatistics";

const page = () => {
  const goalsCompleted = [
    { name: "Correr 2km 7 dias", date: "21/09/2023" },
    { name: "Fazer 30 flexões 5 dias", date: "10/05/2023" },
    { name: "200km de bike em 30 dias", date: "03/04/2023" },
  ];

  return (
    <div className="flex flex-col-reverse md:flex-row  md:gap-6 justify-center lg:pr-80 lg:min-h-screen lg:box-content ">
      <div className="flex flex-col flex-grow gap-3 pb-24 lg:pb-0">
        <div
          className="p-10 lg:px-24 box-border flex bg-zinc-950 justify-center rounded-xl overflow-hidden relative"
          id="div-limite"
        >
          <Image
            alt="challenge image"
            src={MonthChallenge}
            className="lg:w-96 absolute opacity-80 ml-20 lg:ml-32 top-[-30px] lg:top-[-80px]"
          />
          <div className=" max-w-2xl  flex flex-grow flex-col shadow-md  z-10 relative">
            <div className="flex flex-col lg:flex-row justify-between mb-4">
              <span className="font-extrabold text-2xl ">Desafio do Mês</span>
              <span className="flex items-end ">
                <AlarmClock
                  className="mb-1 opacity-80"
                  strokeWidth={3}
                  width={30}
                />
                <p className="self-end opacity-80 font-extrabold">30 dias</p>
              </span>
            </div>
            <div className="flex mb-16 lg:mb-24 ">
              <span className="font-extrabold text-xl text-zinc-600 p-2 px-6 rounded-lg bg-zinc-200">
                Outubro
              </span>
            </div>
            <div className="bg-zinc-900 rounded-lg p-3 lg:p-5">
              <div className="lg:text-xl font-extrabold mb-6">
                <p>Corra 50 (km) quilômetros</p>
              </div>
              <div className="flex box-content">
                <span className="absolute w-[2rem] max-w-[31rem] bg-zinc-950 p-2 lg:py-3 rounded-lg left-[0.700rem] lg:left-[1.2rem] box-content"></span>
                <span className="w-full bg-zinc-200 p-2 lg:py-3 rounded-lg  max-w-[31rem] box-content"></span>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-rows-4  p-2 bg-zinc-800 rounded-lg min-w-full border px-6 lg:px-20">
          <div className="flex w-full justify-center gap-4 items-center border-b">
            <Image src={actualQuests} alt="actualQuestsIcon" className="w-16" />
            <span className="w-full bg-zinc-200 p-2 py-3 rounded-lg max-w-[31rem] box-border relative">
              <p className="absolute top-[0.15rem] font-bold text-sm text-zinc-300 z-30">
                Estudar 200 horas
              </p>
              <span className="absolute w-[9rem] max-w-[31rem] bg-zinc-950 rounded-lg left-[-1px] top-0 p-3 box-border"></span>
            </span>
          </div>
          <div className="flex w-full justify-center gap-4 items-center border-b">
            <Image src={actualQuests} alt="actualQuestsIcon" className="w-16" />
            <span className="w-full bg-zinc-200 p-2 py-3 rounded-lg max-w-[31rem] box-border relative">
              <p className="absolute top-[0.15rem] font-bold text-sm text-zinc-300 z-30">
                Estudar 200 horas
              </p>
              <span className="absolute w-[9rem] max-w-[31rem] bg-zinc-950 rounded-lg left-[-1px] top-0 p-3 box-border"></span>
            </span>
          </div>
          <div className="flex w-full justify-center gap-4 items-center border-b">
            <Image src={actualQuests} alt="actualQuestsIcon" className="w-16" />
            <span className="w-full bg-zinc-200 p-2 py-3 rounded-lg max-w-[31rem] box-border relative">
              <p className="absolute top-[0.15rem] font-bold text-sm text-zinc-300 z-30">
                Estudar 200 horas
              </p>
              <span className="absolute w-[9rem] max-w-[31rem] bg-zinc-950 rounded-lg left-[-1px] top-0 p-3 box-border"></span>
            </span>
          </div>
          <div className="flex w-full justify-center gap-4 items-center">
            <Image src={actualQuests} alt="actualQuestsIcon" className="w-16" />
            <span className="w-full bg-zinc-200 p-2 py-3 rounded-lg max-w-[31rem] box-border relative">
              <p className="absolute top-[0.15rem] font-bold text-sm text-zinc-300 z-30">
                Estudar 200 horas
              </p>
              <span className="absolute w-[9rem] max-w-[31rem] bg-zinc-950 rounded-lg left-[-1px] top-0 p-3 box-border"></span>
            </span>
          </div>
        </div>
      </div>
      {/* SIDE BAR */}
      <section className="w-full h-full pb-4  lg:pb-28 userstats-md userstats-lg bg-zinc-900 lg:border-l-0 mx-2">
        <div className="my-4 mr-4 flex justify-center lg:block">
          <MiniStatistics />
        </div>
        <div className="h-full flex flex-col gap-2  max-h-[25rem]  border rounded-lg p-2 mr-3.5 lg:mr-0">
          <span className="flex justify-between items-center ">
            <h1 className="w-1 font-extrabold">Missões Concluídas</h1>
            <h1 className="opacity-50 font-extrabold hover:opacity-80">
              Ver todas
            </h1>
          </span>
          <span className="flex ">
            <ul className="min-w-full">
              {goalsCompleted.map((goal, index) => (
                <li className="font-light text-xs" key={index}>
                  <span className="flex justify-between">
                    <p>{goal.name}</p>
                    <p>{goal.date}</p>
                  </span>
                </li>
              ))}
            </ul>
          </span>
        </div>
      </section>
    </div>
  );
};

export default page;
