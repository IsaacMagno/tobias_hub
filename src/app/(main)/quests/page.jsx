"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { AlarmClock } from "lucide-react";

import MonthChallenge from "/public/questsIcon/monthChallenge.svg";
import MonthChallengeCompleted from "/public/questsIcon/monthChallengeCompleted.svg";

import actualQuests from "/public/questsIcon/actualQuests.svg";

import MiniStatistics from "../components/LayoutComponents/MiniStatistics";
import { useGlobalState } from "../../services/state";
import { useRouter } from "next/navigation";

const page = () => {
  const [questsList, setQuestsList] = useState([]);
  const [monthlyChallenge, setMonthlyChallenge] = useState();
  const [monthlyChallengeDays, setMonthlyChallengeDays] = useState();
  const [challengePercentage, setChallengePercentage] = useState(0);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const router = useRouter();

  const { data: session } = useSession();
  const {
    globalState: { champion },
  } = useGlobalState();

  const calculateChallengePercentage = (challenge) => {
    var percentage = (challenge.questActual / challenge.questGoal) * 100;
    if (percentage > 100) return 100 + "%";
    return percentage + "%";
  };

  useEffect(() => {
    if (champion) {
      setQuestsList(champion.quests);
      setMonthlyChallenge(champion.monthlyChallenge);
      if (champion.monthlyChallenge) {
        const percentage = calculateChallengePercentage(
          champion.monthlyChallenge
        );
        setChallengePercentage(percentage);
        const hoje = new Date();
        const dataFutura = new Date(champion.monthlyChallenge.questLimitDate);
        const diferencaTempo = Math.abs(dataFutura - hoje);
        const diferencaDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));

        setMonthlyChallengeDays(diferencaDias);

        if (champion.monthlyChallenge.completed) {
          setChallengeCompleted(true);
        }
      }
    } else {
      router.push("/");
    }
  }, [session, champion]);

  return (
    <div className="flex flex-col-reverse md:flex-row  md:gap-6 justify-center lg:pr-80 lg:min-h-screen lg:box-content ">
      <div className="flex flex-col flex-grow gap-3 pb-24 lg:pb-0">
        <div
          className="p-10 lg:px-24 box-border flex bg-zinc-950 justify-center rounded-xl overflow-hidden relative"
          id="div-limite"
        >
          <Image
            alt="challenge image"
            src={!challengeCompleted ? MonthChallenge : MonthChallengeCompleted}
            className="lg:w-96 absolute  ml-20 lg:ml-32 top-[-30px] lg:top-[-80px]"
          />
          {monthlyChallenge && (
            <div className=" max-w-2xl  flex flex-grow flex-col   z-10 relative">
              <div className="flex flex-col lg:flex-row justify-between mb-4">
                <span className="font-extrabold text-2xl ">Desafio do Mês</span>
                <span className="flex items-end ">
                  <AlarmClock
                    className="mb-1 opacity-80"
                    strokeWidth={3}
                    width={30}
                  />
                  <p className="self-end opacity-80 font-extrabold">
                    {!monthlyChallengeDays ? "0" : monthlyChallengeDays} dias
                  </p>
                </span>
              </div>
              <div className="flex mb-16 lg:mb-24 ">
                <span className="font-extrabold text-xl text-zinc-600 p-2 px-6 rounded-lg bg-zinc-200">
                  {!monthlyChallenge.questMonth
                    ? "Mẽs"
                    : monthlyChallenge.questMonth}
                </span>
              </div>
              <div className="bg-zinc-900 rounded-lg p-3 lg:p-5">
                <div className="lg:text-xl font-extrabold mb-6">
                  <p>
                    {!monthlyChallenge.questName
                      ? "Desafio do mês"
                      : monthlyChallenge.questName}
                  </p>
                </div>
                {/* <div className="flex box-content">
                  <span className="absolute w-[0rem] max-w-[31rem] bg-zinc-950 p-2 lg:py-3 rounded-lg left-[0.700rem] lg:left-[1.2rem] box-content"></span>
                  <span className="w-full bg-zinc-200 p-2 lg:py-3 rounded-lg  max-w-[31rem] box-content"></span>
                </div> */}
                <div className="progress max-w-full">
                  <div
                    className="progress__fill "
                    style={{ width: challengePercentage }}
                  ></div>
                  <span className="progress__text font-extrabold">
                    {challengePercentage}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* <div className="grid grid-rows-4  p-2 bg-zinc-800 rounded-lg min-w-full border px-6 lg:px-20"> */}
        <div className="flex items-center justify-center p-2 bg-zinc-800 rounded-lg min-w-full border px-6 lg:px-20">
          {!questsList.length ? (
            <h1>Quests diárias em breve</h1>
          ) : (
            questsList.map((quest) => {
              if (quest.completed === true) {
                return (
                  <div className="flex w-full justify-center gap-4 items-center border-b">
                    <Image
                      src={actualQuests}
                      alt="actualQuestsIcon"
                      className="w-16"
                    />
                    <span className="w-full bg-zinc-200 p-2 py-3 rounded-lg max-w-[31rem] box-border relative">
                      <p className="absolute top-[0.15rem] font-bold text-sm text-zinc-800 z-30">
                        {quest.questName}
                      </p>
                      <span className="absolute w-[0rem] max-w-[31rem] bg-zinc-950 rounded-lg left-[-1px] top-0 p-3 box-border"></span>
                    </span>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
      {/* SIDE BAR */}
      <section className="w-full h-full pb-4  lg:pb-28 userstats-md userstats-lg bg-zinc-900 lg:border-l-0 mx-2">
        <div className="my-4 mr-4 flex justify-center ">
          {champion && (
            <MiniStatistics
              tobiasCoins={champion.tobiasCoins}
              xp={champion.xp}
              level={champion.level}
              daystreak={champion.daystreak}
              daystreakShield={champion.daystreakShield}
            />
          )}
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
              {questsList &&
                questsList.map((quest, index) => {
                  if (quest.completed === true) {
                    const date = new Date(quest.completedDate);
                    const formattedDate = date.toLocaleDateString("pt-BR");
                    return (
                      <li className="font-light text-xs" key={index}>
                        <span className="flex justify-between">
                          <p>{quest.questName}</p>
                          <p>{formattedDate}</p>
                        </span>
                      </li>
                    );
                  }
                })}
            </ul>
          </span>
        </div>
      </section>
    </div>
  );
};

export default page;
