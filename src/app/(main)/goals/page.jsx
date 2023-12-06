"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import GoalsIcon from "/public/goalsIcons/goals.svg";
import MiniStatistics from "../components/LayoutComponents/MiniStatistics";
import Dropdown from "../components/Dropdown";
import ActualGoalsScrollBar from "./ActualGoalsScrollBar";

import { createGoal } from "../../services/requests";
import { useGlobalState } from "../../services/state";

import { useHandleUpdateChampionData } from "../../hooks/useHandleUpdateChampionData";

import Loading from "../loading";
import { goalsVincNameToKey } from "./goalsVinc";

const page = () => {
  const [goalTime, setGoalTime] = useState("Anual");
  const [goalStats, setGoalType] = useState("Stats");
  const [goalVinc, setGoalVinc] = useState("Vinculo");
  const [goalDescription, setGoalDescription] = useState();
  const [goalNumber, setGoalNumber] = useState();
  const [vincArray, setVincArray] = useState([""]);
  const [goalList, setGoalList] = useState();
  const [champion_id, setChampionId] = useState();
  const [accessToken, setAccessToken] = useState();

  const [showGoalTime, setShowGoalTime] = useState(false);
  const [showGoalType, setShowGoalType] = useState(false);
  const [showGoalVinc, setShowGoalVinc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateChampionData = useHandleUpdateChampionData();

  const router = useRouter();

  const { data: session } = useSession();
  const {
    globalState: { champion },
  } = useGlobalState();

  useEffect(() => {
    if (session) {
      const { accessToken } = session;
      setAccessToken(accessToken);
    }

    if (champion) {
      setChampionId(champion.id);
      setGoalList(champion.goal);
    } else {
      router.push("/");
    }
  }, [session, champion]);

  useEffect(() => {
    const handleChangeType = () => {
      let newVincArray = [];

      switch (goalStats) {
        case "DEX":
          newVincArray = ["Km corridos", "Saltos de corda", "Km pedalados"];
          setGoalVinc("Vinculo");

          break;
        case "STR":
          newVincArray = [
            "Treino superior",
            "Treino abdominal",
            "Treino inferior",
          ];
          setGoalVinc("Vinculo");
          break;
        case "INT":
          newVincArray = ["Horas estudando", "Horas meditando", "Horas lendo"];
          setGoalVinc("Vinculo");
          break;
        case "CON":
          newVincArray = ["Horas de sono", "Litros de água", "Ref. saudáveis"];
          setGoalVinc("Vinculo");
          break;
        case "Nenhum":
          newVincArray = [];
          setGoalVinc("Vinculo");
          break;
      }

      setVincArray(newVincArray);
    };

    handleChangeType();
  }, [goalStats]);

  const disableActiveDropdowns = () => {
    if (showGoalVinc) setShowGoalVinc(false);
    if (showGoalTime) setShowGoalTime(false);
    if (showGoalType) setShowGoalType(false);
  };

  const handleCreateGoal = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const goalData = {
      stats: goalStats,
      link: goalsVincNameToKey[goalVinc],
      name: goalDescription,
      type: goalTime,
      goal: goalNumber,
      champion_id,
    };

    await createGoal(accessToken, goalData);

    handleUpdateChampionData(champion_id, accessToken);

    setGoalTime("Anual");
    setGoalType("Stats");
    setGoalVinc("Vinculo");
    setVincArray([""]);
    setGoalDescription();
    setGoalNumber();
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col-reverse md:flex-row  md:gap-6 justify-center lg:pr-80 lg:min-h-screen lg:box-content ">
      <div className="flex flex-col flex-grow gap-3">
        <div className="py-2 px-2 lg:px-24 box-border flex bg-zinc-950 justify-center rounded-xl min-h-[20rem]">
          {isLoading ? (
            <div className="flex items-center justify-center max-w-2xl  flex-grow flex-col">
              <Loading
                textColor="text-white"
                opacity="100"
                textSize="text-xl"
                barWidth="200"
                barHeight="60"
                minHeight={false}
              />
            </div>
          ) : (
            <form
              className=" max-w-2xl  flex flex-grow flex-col  "
              onSubmit={handleCreateGoal}
            >
              <div className="flex justify-evenly">
                <Image
                  src={GoalsIcon}
                  alt="goals icon"
                  className="w-36 lg:w-48"
                />

                <div className="flex flex-col gap-2 py-2">
                  <div
                    className=""
                    onClick={() => {
                      setShowGoalType(!showGoalType), disableActiveDropdowns();
                    }}
                  >
                    <Dropdown
                      show={showGoalType}
                      optionsText={["DEX", "STR", "INT", "CON", "Nenhum"]}
                      handleChange={setGoalType}
                      placeholder={goalStats}
                    />
                  </div>
                  <div
                    className=""
                    onClick={() => {
                      setShowGoalVinc(!showGoalVinc), disableActiveDropdowns();
                    }}
                  >
                    <Dropdown
                      show={showGoalVinc}
                      optionsText={vincArray}
                      handleChange={setGoalVinc}
                      placeholder={goalVinc}
                    />
                  </div>
                  <div>
                    <input
                      className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base appearance-none outline-none border-2 border-zinc-950 text-zinc-800"
                      placeholder="Objetivo"
                      value={goalDescription}
                      onChange={({ target }) =>
                        setGoalDescription(target.value)
                      }
                    />
                  </div>
                  <div>
                    <input
                      className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base appearance-none outline-none border-2 border-zinc-950 text-zinc-800"
                      placeholder="Meta"
                      value={goalNumber}
                      onChange={({ target }) => setGoalNumber(target.value)}
                    />
                  </div>
                  <div
                    className=""
                    onClick={() => {
                      setShowGoalTime(!showGoalTime), disableActiveDropdowns();
                    }}
                  >
                    <Dropdown
                      show={showGoalTime}
                      optionsText={["Anual", "Mensal"]}
                      handleChange={setGoalTime}
                      placeholder={goalTime}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base border-2 border-black bg-zinc-600 hover:bg-zinc-600/90"
                    >
                      Criar
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
        <div className="block pb-24 lg:pb-0">
          {goalList && (
            <ActualGoalsScrollBar
              goalList={goalList}
              setGoalList={setGoalList}
              token={accessToken}
              champion_id={champion_id}
            />
          )}
        </div>
      </div>
      {/* SIDE BAR */}
      <section className="w-full h-full pb-4 lg: lg:pb-28 userstats-md userstats-lg bg-zinc-900 lg:border-l-0 mx-2">
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
            <h1 className="w-1 font-extrabold">Metas Alcançadas</h1>
            <h1 className="opacity-50 font-extrabold hover:opacity-80">
              Ver todas
            </h1>
          </span>
          <span className="flex">
            <ul className="min-w-full">
              {goalList &&
                goalList.map((goal, index) => {
                  if (goal.completed === true) {
                    const date = new Date(goal.completedDate);
                    const formattedDate = date.toLocaleDateString("pt-BR");
                    return (
                      <li className="font-light text-xs" key={index}>
                        <span className="flex justify-between">
                          <p>{goal.name}</p>
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
