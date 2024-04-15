"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

import userStatsImage from "/public/userStats/stats.svg";
import { Tooltip } from "@mui/material";
import Activities from "./Activities";
import { useGlobalState } from "../../services/state";
import { getStatsDetailsById } from "../../services/requests";

const translationMap = {
  strFromUpper: "Superior",
  strFromLower: "Inferior",
  strFromAbs: "Abdominal",
  dexFromRope: "Saltos com Corda",
  dexFromBike: "Km de Bike",
  dexFromRun: "Km Corridos",
  conFromMeals: "Refeições",
  conFromDrinks: "Água",
  conFromSleep: "Sono",
  intFromStudy: "Estudo",
  intFromMeditation: "Meditação",
  intFromReading: "Leitura",
};

const UserStats = ({
  statistics: propStatistics,
  activities: propActivities,
}) => {
  const [statsDetails, setStatsDetails] = useState();

  const {
    globalState: { champion },
  } = useGlobalState();

  const statistics = !propStatistics ? champion.statistics : propStatistics;
  const activities = !propActivities ? champion.activities : propActivities;
  const championId = !propStatistics ? champion.id : propStatistics.champion_id;

  const championStatsDetails = async () => {
    const { statsDetailsFromId } = await getStatsDetailsById(championId);
    setStatsDetails(statsDetailsFromId);
  };

  useEffect(() => {
    championStatsDetails();
  }, []);

  return (
    <section className="w-full h-full mt-4 pb-28 userstats-md userstats-lg bg-zinc-900">
      <div className="flex items-center justify-evenly gap-2">
        <Image src={userStatsImage} alt="user stats" className="w-10 h-10" />
        <h1 className="text-xl font-semibold my-4 ">Caracteristica</h1>

        <div></div>
      </div>

      <ul className="list-none space-y-2">
        <li>
          <Tooltip
            title={
              <span className="flex flex-col p-1 gap-0.5 font-bold min-w-[8vw] items-end">
                {statsDetails &&
                  Object.entries(statsDetails)
                    .filter(([key, value]) => key.startsWith("str"))
                    .map(([key, value]) => (
                      <p className="text-xs" key={key}>
                        <span>
                          {translationMap[key]}: {value.toFixed(2)}
                        </span>
                      </p>
                    ))}
              </span>
            }
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -10],
                    },
                  },
                ],
              },
            }}
            placement="left"
            className="flex justify-between border-b"
          >
            <span className="text-sm lg:text-[15px] font-medium flex gap-2">
              <p className="w-14 ">( STR )</p>
              <p>Força</p>
            </span>
            <p className="text-sm lg:text-[15px] font-bold opacity-80">
              {statistics.strength}
            </p>
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title={
              <span className="flex flex-col p-1 gap-0.5 font-bold min-w-[8vw] items-end">
                {statsDetails &&
                  Object.entries(statsDetails)
                    .filter(([key, value]) => key.startsWith("dex"))
                    .map(([key, value]) => (
                      <p className="text-xs flexx" key={key}>
                        <span>
                          {translationMap[key]}: {value.toFixed(2)}
                        </span>
                      </p>
                    ))}
              </span>
            }
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -10],
                    },
                  },
                ],
              },
            }}
            placement="left"
            className="flex justify-between border-b"
          >
            <span className="flex justify-between border-b">
              <span className="text-sm lg:text-[15px] font-medium flex gap-2">
                <p className="w-14">( DEX )</p>
                <p>Destreza</p>
              </span>
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                {statistics.agility}
              </p>
            </span>
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title={
              <span className="flex flex-col p-1 gap-0.5 font-bold min-w-[8vw] items-end">
                {statsDetails &&
                  Object.entries(statsDetails)
                    .filter(([key, value]) => key.startsWith("int"))
                    .map(([key, value]) => (
                      <p className="text-xs flexx" key={key}>
                        <span>
                          {translationMap[key]}: {value.toFixed(2)}
                        </span>
                      </p>
                    ))}
              </span>
            }
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -10],
                    },
                  },
                ],
              },
            }}
            placement="left"
            className="flex justify-between border-b"
          >
            <span className="flex justify-between border-b">
              <span className="text-sm lg:text-[15px] font-medium flex gap-2">
                <p className="w-14">( INT )</p>
                <p>Inteligência</p>
              </span>
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                {statistics.inteligence}
              </p>
            </span>
          </Tooltip>
        </li>
        <li>
          <Tooltip
            title={
              <span className="flex flex-col p-1 gap-0.5 font-bold min-w-[8vw] items-end">
                {statsDetails &&
                  Object.entries(statsDetails)
                    .filter(([key, value]) => key.startsWith("con"))
                    .map(([key, value]) => (
                      <p className="text-xs flexx" key={key}>
                        <span>
                          {translationMap[key]}: {value.toFixed(2)}
                        </span>
                      </p>
                    ))}
              </span>
            }
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, -10],
                    },
                  },
                ],
              },
            }}
            placement="left"
            className="flex justify-between border-b"
          >
            <span className="flex justify-between border-b ">
              <span className="text-sm lg:text-[15px] font-medium flex gap-2">
                <p className="w-14">( CON )</p>
                <p>Constituição</p>
              </span>
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                {statistics.vitality}
              </p>
            </span>
          </Tooltip>
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

export default UserStats;
