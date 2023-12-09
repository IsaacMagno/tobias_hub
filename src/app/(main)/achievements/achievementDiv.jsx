import Image from "next/image";
import React, { useState } from "react";

import xp from "/public/userstreak/xp.svg";
import achievTemp from "/public/achievementIcons/achievTemp.svg";

import tobiasCoin from "/public/userstreak/tobiasCoin.svg";
import achievPoints from "/public/userstreak/achievPoints.svg";

const AchievementDiv = (achievement) => {
  const [showMore, setShowMore] = useState(false);
  const rewards = JSON.parse(achievement.rewards);
  // const rewards = achievement.rewards;

  return (
    <div
      className="grid grid-cols-4 bg-zinc-600 p-2 rounded-lg gap-3 cursor-pointer"
      onClick={() => setShowMore(!showMore)}
    >
      <div className="flex flex-col items-center">
        <Image
          src={!achievement.icon ? achievTemp : achievement.icon}
          alt="achievementIcon"
          width={12}
          height={12}
          className="w-8 lg:w-12"
        />
        <span className="font-bold text-sm lg:text-base lg:font-extrabold text-center">
          {achievement.name}
        </span>
      </div>

      <div className="bg-zinc-950 rounded-lg flex flex-grow flex-col items-center justify-center  col-span-2">
        <div className="flex flex-col lg:flex-row gap-2 justify-center">
          <span className="flex gap-1">
            <Image alt="xp" src={xp} className="w-4 lg:w-7" />
            <p>{rewards.xp}</p>
          </span>
          <span className="flex gap-1">
            <Image alt="tobiasCoin" src={tobiasCoin} className="w-4 lg:w-7" />
            <p>{rewards.tobiasCoins}</p>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <span className="flex flex-col lg:flex-row gap-1 items-center ">
          <Image alt="achievementPoints" src={achievPoints} className="w-12" />
          <p className="font-extrabold lg:text-lg">
            {rewards.achievementPoints}
          </p>
        </span>
      </div>
      {showMore ? (
        <div className="col-span-full text-center">
          <p className="font-extrabold text-sm">{achievement.description}</p>
          {achievement.completedDate && (
            <p className="font-extrabold text-sm">
              Completou: {achievement.completedDate}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default AchievementDiv;
