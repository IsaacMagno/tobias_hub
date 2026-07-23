"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

import UserStats from "../../components/UserStats";
import UserBiography from "../../components/UserBiography";
import UserStatistics from "../../components/UserStatistics";
import UserAchievements from "../../components/UserAchievements";
import { getChampionDataById } from "../../../services/requests";
import Loading from "./loading";

const ChampionPage = () => {
  const [championData, setChampionData] = useState();
  const { championId } = useParams();
  const { data: session } = useSession();

  useEffect(() => {
    const getChampionData = async () => {
      if (championId) {
        const { accessToken } = session;

        const champion = await getChampionDataById(championId, accessToken);
        setChampionData(champion);
      }
    };

    getChampionData();
  }, [championId]);

  return championData ? (
    <div className="flex flex-col md:flex-row rounded-md md:gap-6 justify-center lg:items-start lg:pr-80 lg:min-h-screen lg:box-content">
      <div className="flex flex-col gap-5">
        {/* USER BIOGRAPHY */}
        <UserBiography displayBio={true} userData={championData} />
        {/* USER STATISTICS */}
        <UserStatistics userData={championData} />
        {/* USER ACHIEVEMENTS */}
        <UserAchievements />
      </div>
      {/* USER STATS */}
      <UserStats
        statistics={championData.statistics}
        activities={championData.activities}
      />
    </div>
  ) : (
    <Loading />
  );
};

export default ChampionPage;
