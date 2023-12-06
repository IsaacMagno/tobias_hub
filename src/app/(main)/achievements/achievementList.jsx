import React, { useState, useEffect } from "react";
import AchievementDiv from "./achievementDiv";
import { getAchievements } from "../../services/requests";

const achievementList = ({ sumaryActivitie, champion }) => {
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    const getAchievs = async () => {
      const { achievements } = await getAchievements();

      const filteredAchievs = achievements.filter(
        (achiev) => achiev.link === sumaryActivitie
      );

      const completedAchievements = champion.achievementsCompleted;

      // Mapeia filteredAchievs para adicionar a data de conclusão, se a conquista estiver em completedAchievements
      const achievsWithCompletionDate = filteredAchievs.map((achiev) => {
        const completedAchiev = completedAchievements.find(
          (completed) => completed.achievement_id === achiev.id
        );

        return completedAchiev
          ? { ...achiev, completedDate: completedAchiev.date }
          : achiev;
      });

      setAchievements(achievsWithCompletionDate);
    };
    getAchievs();
  }, [sumaryActivitie]);

  return (
    <div className="flex flex-col gap-2 overflow-y-scroll  max-h-[50rem] pt-40 p-4 rounded-lg">
      {achievements.map((achievement, index) => (
        <AchievementDiv {...achievement} key={index} />
      ))}
    </div>
  );
};

export default achievementList;
