import React from "react";
import Image from "next/image";
import daystreakImage from "/public/userstreak/daystreak.svg";
import daystreakShieldImage from "/public/userstreak/daystreakShield.svg";
import daystreakShieldBroken from "/public/userstreak/daystreakShieldBroken.svg";

import xpImage from "/public/userstreak/xp.svg";
import levelImage from "/public/userstreak/level.svg";
import tobiasCoin from "/public/userstreak/tobiasCoin.svg";

const MiniStatistics = ({
  tobiasCoins,
  xp,
  level,
  daystreak,
  daystreakShield,
}) => {
  return (
    <div className="flex gap-2">
      <div>
        <span className="flex  items-center cursor-default gap-[0.200rem] ">
          <Image src={tobiasCoin} alt={"tobiasCoin image"} className="w-5" />
          <p className="font-bold text-xs opacity-50 hover:opacity-80">
            {tobiasCoins}
          </p>
        </span>
      </div>

      <div>
        <span className="flex   items-center cursor-default gap-0 ">
          <Image src={xpImage} alt={"xp image"} className="w-5" />
          <p className="font-bold text-xs opacity-50 hover:opacity-80">{xp}</p>
        </span>
      </div>

      <div>
        <span className="flex  items-center cursor-default gap-[0.200rem] ">
          <Image src={levelImage} alt={"level image"} className="w-5" />
          <p className="font-bold text-xs opacity-50 hover:opacity-80">
            {level}
          </p>
        </span>
      </div>

      <div>
        <span className="flex  items-center cursor-default gap-[0.200rem] ">
          <Image src={daystreakImage} alt={"daystreak image"} className="w-5" />
          <p className="font-bold text-xs opacity-50 hover:opacity-80">
            {daystreak}
          </p>
        </span>
      </div>

      <div>
        <span className="flex  items-center cursor-default gap-[0.200rem] ">
          <Image
            src={
              daystreakShield > 0 ? daystreakShieldImage : daystreakShieldBroken
            }
            alt={"daystreak image"}
            className="w-5"
          />
          <p className="font-bold text-xs opacity-50 hover:opacity-80">
            {daystreakShield}
          </p>
        </span>
      </div>
    </div>
  );
};

export default MiniStatistics;
