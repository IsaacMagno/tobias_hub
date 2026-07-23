import React from "react";
import Image from "next/image";

import daystreakImage from "/public/userstreak/daystreak.svg";
import xpImage from "/public/userstreak/xp.svg";
import levelImage from "/public/userstreak/level.svg";
import achievImage from "/public/userstreak/achievPoints.svg";

const UserStatistics = ({ userData }) => {
  return (
    <div className="flex flex-col gap-3 ">
      <div>
        <h1 className="text-2xl font-bold ">Estatísticas</h1>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center sm:justify-normal">
        <div className="userstreaks-div">
          <span className="userstreaks-span">
            <Image
              className="userstreaks-img"
              alt={"teste"}
              src={daystreakImage}
            />
            <div className="userstreak-text-div">
              <p className="font-extrabold text-sm lg:text-lg">
                {userData.daystreak}
              </p>
              <p className="font-bold opacity-80 text-xs lg:text-sm">
                Dias seguidos
              </p>
            </div>
          </span>
        </div>
        <div className="userstreaks-div">
          <span className="userstreaks-span">
            <Image className="userstreaks-img" alt={"teste"} src={xpImage} />
            <div className="userstreak-text-div">
              <p className="font-extrabold text-sm lg:text-lg">{userData.xp}</p>
              <p className="font-bold opacity-80 text-xs lg:text-sm">
                Total de XP
              </p>
            </div>
          </span>
        </div>
        <div className="userstreaks-div">
          <span className="userstreaks-span">
            <Image className="userstreaks-img" alt={"teste"} src={levelImage} />
            <div className="userstreak-text-div">
              <p className="font-extrabold text-sm lg:text-lg">
                {userData.level}
              </p>
              <p className="font-bold opacity-80 text-xs lg:text-sm">
                Nivel alcançado
              </p>
            </div>
          </span>
        </div>
        <div className="userstreaks-div">
          <span className="userstreaks-span">
            <Image
              className="userstreaks-img"
              alt={"teste"}
              src={achievImage}
            />
            <div className="userstreak-text-div">
              <p className="font-extrabold text-sm lg:text-lg">
                {userData.achievementPoints}
              </p>
              <p className="font-bold opacity-80 text-xs lg:text-sm">
                Pts de Conquista
              </p>
            </div>
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserStatistics;
