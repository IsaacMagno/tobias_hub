"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

import UserBiography from "./components/UserBiography";
import UserStats from "./components/UserStats";
import Calendar from "./components/Calendar";
import ActivitiesIncrease from "./components/SelectIncrease/ActivitiesIncrease.jsx";
import Loading from "./loading.jsx";

import { getChampionDataById } from "../services/requests";
import { useGlobalState } from "../services/state";

const Home = () => {
  const { globalState, setGlobalState } = useGlobalState();
  const [renderCalendar, setRenderCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { data: session } = useSession();

  const {
    globalState: { champion },
  } = useGlobalState();

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
  }, []);

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
              />
            )}

            <div>
              <Calendar
                show={renderCalendar}
                calendar={champion.calendars}
                token={session.accessToken}
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
