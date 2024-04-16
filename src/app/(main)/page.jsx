"use client";
import toast from "react-hot-toast";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import UserBiography from "./components/UserBiography";
import UserStats from "./components/UserStats";
import Calendar from "./components/Calendar";
import ActivitiesIncrease from "./components/SelectIncrease/ActivitiesIncrease.jsx";
import Loading from "./loading.jsx";

import { getChampionDataById } from "../services/requests";
import { useGlobalState } from "../services/state";

import achievTemp from "/public/achievementIcons/achievTemp.svg";
import Image from "next/image.js";

const Home = () => {
  const { globalState, setGlobalState } = useGlobalState();
  const [renderCalendar, setRenderCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [achievementCompleted, setAchievementCompleted] = useState(false);

  const { data: session } = useSession();

  const {
    globalState: { champion },
  } = useGlobalState();

  useEffect(() => {
    if (achievementCompleted) {
      toast((t) => (
        <div className="flex justify-center items-center gap-3">
          <Image src={achievTemp} width={60} />
          <p className="font-extrabold text-center">
            Novas conquistas desbloqueadas!
          </p>
        </div>
      ));
    }

    setAchievementCompleted(false);
  }, [achievementCompleted]);

  useEffect(() => {
    const getChampionData = async () => {
      const {
        user: { champion_id },
      } = session;
      const { accessToken } = session;

      const champion = await getChampionDataById(champion_id, accessToken);

      setGlobalState({
        ...globalState,
        champion,
      });

      setRenderCalendar(true);
      setIsLoading(false);
    };

    if (session) {
      getChampionData();
    }

    console.log(session);
  }, [session]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col  md:gap-6 justify-center lg:pr-80 lg:min-h-screen lg:box-content">
      {champion && (
        <>
          <div className="flex flex-col gap-3">
            <UserBiography displayBio={false} userData={champion} />

            {session && (
              <ActivitiesIncrease
                championId={champion.id}
                token={session.accessToken}
                setAchievementCompleted={setAchievementCompleted}
              />
            )}

            <div>
              <Calendar
                show={renderCalendar}
                token={session.accessToken}
                championId={champion.id}
              />
            </div>
          </div>
          <UserStats
            statistics={champion.statistics}
            activities={champion.activities}
          />
        </>
      )}
    </div>
  );
};

export default Home;
