"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { AlarmClock, RefreshCcw } from "lucide-react";

import MonthChallenge from "/public/questsIcon/monthChallenge.svg";
import MonthChallengeCompleted from "/public/questsIcon/monthChallengeCompleted.svg";

import actualQuests from "/public/questsIcon/actualQuests.svg";
import tobiasCoinsImage from "/public/userstreak/tobiasCoin.svg";

import MiniStatistics from "../components/LayoutComponents/MiniStatistics";
import { useGlobalState } from "../../services/state";
import { useRouter } from "next/navigation";
import {
  getAllChampionsMonthlyChallenge,
  getChampionDataById,
  regenerateDailyQuest,
} from "../../services/requests";
import Loading from "../loading";

const page = () => {
  const [questsList, setQuestsList] = useState([]);
  const [monthlyChallenge, setMonthlyChallenge] = useState();
  const [monthlyChallengeDays, setMonthlyChallengeDays] = useState();
  const [challengePercentage, setChallengePercentage] = useState(0);
  const [questsProgress, setQuestsProgress] = useState([]);
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [isLoadingNewQuest, setIsLoadingNewQuest] = useState(false);
  const [championsProgressList, setChampionsProgressList] = useState([]);

  const { globalState, setGlobalState } = useGlobalState();

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

      // Atualiza o progresso das quests
      const updatedQuestsProgress = champion.quests.map((quest) => {
        const percentage = (quest.questActual / quest.questGoal) * 100;
        return {
          questId: quest.id,
          progress: percentage > 100 ? 100 : percentage,
        };
      });
      setQuestsProgress(updatedQuestsProgress);

      const getChampionsMonthlyChallengeProgress = async () => {
        const { champions } = await getAllChampionsMonthlyChallenge();

        const sortedChampions = champions.sort((a, b) => {
          // Lidar com casos onde monthlyChallenge é null
          const questActualA = a.monthlyChallenge?.questActual ?? 0;
          const questActualB = b.monthlyChallenge?.questActual ?? 0;

          // Ordenação decrescente
          return questActualB - questActualA;
        });

        // Pegar apenas os 10 primeiros
        const top10Champions = sortedChampions.slice(0, 10);

        setChampionsProgressList(top10Champions);
      };

      getChampionsMonthlyChallengeProgress();
    } else {
      router.push("/");
    }
  }, [session, champion]);

  const confirmQuestUpdate = (questId, questName) => {
    // Obtém a data atual e a data da última atualização gratuita
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera o tempo para comparar apenas as datas
    const lastUpdateDate = new Date(champion.lastFreeQuestUpdate);
    lastUpdateDate.setHours(0, 0, 0, 0);

    // Determina se a atualização é gratuita
    const isFreeUpdate = lastUpdateDate.getTime() !== today.getTime();

    toast((t) => (
      <div className="flex flex-col gap-4">
        <p className="flex flex-col items-center text-lg ">
          Trocar quest diária?
          {isFreeUpdate ? (
            "gratuito"
          ) : (
            <span className="flex gap-2 ">
              (2000
              <Image src={tobiasCoinsImage} width={18} alt="TobiasCoins" />)
            </span>
          )}
        </p>
        <div className="flex justify-between gap-2 px-10">
          <button
            onClick={() =>
              handleGenerateNewQuest(questId, questName, t.id, isFreeUpdate)
            }
            className="p-2 bg-green-500 rounded text-zinc-200 font-bold"
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-red-500 p-2 rounded text-zinc-200 font-bold"
          >
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const handleGenerateNewQuest = async (
    questId,
    questName,
    toastId,
    isFreeUpdate
  ) => {
    toast.dismiss(toastId);
    setIsLoadingNewQuest(true);

    const price = isFreeUpdate ? 0 : 2000;
    const { questGenerated } = await regenerateDailyQuest({
      championId: champion.id,
      price: price,
      questId,
      questName,
    });

    if (questGenerated) {
      const championUpdated = await getChampionDataById(champion.id); // Assume que esta função retorna os dados atualizados do campeão
      setGlobalState({
        ...globalState,
        champion: championUpdated,
      });
      toast.success("Nova quest gerada");
    } else {
      toast.error(
        isFreeUpdate ? (
          "Falha ao atualizar a quest"
        ) : (
          <div className="flex flex-col items-center">
            TobiasCoins insuficientes
            <span className="flex gap-2">
              (2000
              <Image src={tobiasCoinsImage} width={18} alt="TobiasCoins" />)
            </span>
          </div>
        )
      );
    }

    setIsLoadingNewQuest(false);
  };

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
                <span className="font-extrabold text-xl text-zinc-600 p-2 px-6 rounded-lg bg-zinc-300">
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
        <div className="grid grid-rows-3  p-2  rounded-lg min-w-full border px-6 lg:px-20 items-center bg-zinc-800">
          {/* <div className="flex items-center justify-center p-2 bg-zinc-800 rounded-lg min-w-full border px-6 lg:px-20"> */}

          {isLoadingNewQuest ? (
            <div className="flex  justify-center items-center  row-span-3 py-14">
              <Loading
                textColor="text-white"
                opacity="100"
                textSize="text-xl"
                barWidth="200"
                barHeight="60"
                minHeight={false}
              />
            </div>
          ) : questsList.length > 0 ? (
            questsList.map((quest) => {
              if (quest.completed !== true) {
                const questProgress = questsProgress.find(
                  (p) => p.questId === quest.id
                ) || { progress: 0 };
                const progressStyle = { width: `${questProgress.progress}%` };

                return (
                  <div
                    className="flex w-full justify-center items-center gap-4"
                    key={quest.id}
                  >
                    <Image
                      src={actualQuests}
                      alt="actualQuestsIcon"
                      className="w-16"
                    />
                    <div className="progress max-w-full">
                      <div
                        className="progress__fill"
                        style={progressStyle}
                      ></div>
                      <span className="progress__text font-extrabold flex justify-between pl-3 min-w-full">
                        <p>{quest.questName}</p>
                        <p>{questProgress.progress.toFixed(2)}%</p>
                      </span>
                    </div>
                    <div>
                      <RefreshCcw
                        className="cursor-pointer hover:text-zinc-400"
                        onClick={() =>
                          confirmQuestUpdate(quest.id, quest.questName)
                        }
                      />
                    </div>
                  </div>
                );
              }
              return null;
            })
          ) : (
            <h1 className="flex justify-center">Quests diárias em breve</h1>
          )}
        </div>
      </div>
      {/* SIDE BAR */}
      <section className="w-full h-full pb-4  lg:pb-28 userstats-md userstats-lg bg-zinc-900 lg:border-l-0 mx-2 flex flex-col gap-4">
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
        <div className="h-full flex flex-col gap-2 max-h-[25rem] overflow-y-auto border rounded-lg p-2 mr-3.5 lg:mr-0">
          <span className="flex justify-between items-center ">
            <h1 className="w-1 font-extrabold flex-grow text-center">
              Missões concluídas
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

        <div className=" flex flex-col gap-2  max-h-[25rem]  border rounded-lg p-2 mr-3.5 lg:mr-0">
          <span className="flex justify-between items-center ">
            <h1 className="w-1 font-extrabold flex-grow text-center">
              Ranking desafio Mensal
            </h1>
          </span>
          <span className="flex">
            <ul className="min-w-full">
              {championsProgressList &&
                championsProgressList
                  .filter((champ) => champ.monthlyChallenge.completed === false) // Filtra campeões com desafios não completos
                  .map((champ, index) => (
                    <li className="font-light text-xs" key={index}>
                      <span
                        className={`flex justify-between ${
                          index <= 2 ? "font-bold" : ""
                        }`}
                      >
                        <p>{champ.name}</p>
                        {/* Exibe questActual se disponível, ou "N/A" se não estiver */}
                        <p>{champ.monthlyChallenge?.questActual ?? "N/A"}</p>
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
