import React, { useEffect } from "react";
import Image from "next/image";
import daystreakImage from "/public/userstreak/daystreak.svg";
import daystreakShieldImage from "/public/userstreak/daystreakShield.svg";
import daystreakShieldBroken from "/public/userstreak/daystreakShieldBroken.svg";

import xpImage from "/public/userstreak/xp.svg";
import levelImage from "/public/userstreak/level.svg";
import tobiasCoin from "/public/userstreak/tobiasCoin.svg";
import toast from "react-hot-toast";
import { buyItem } from "../../../services/requests";
import { useHandleUpdateChampionData } from "../../../hooks/useHandleUpdateChampionData";
import { useSession } from "next-auth/react";
import { useGlobalState } from "../../../services/state";
import { Tooltip } from "@mui/material";

const MiniStatistics = ({
  tobiasCoins,
  xp,
  level,
  daystreak,
  daystreakShield,
}) => {
  // const handleFillDaystreakShield = async () => {
  //   toast((t) => (
  //     <div className="flex flex-col justify-center items-center gap-2 p-2">
  //       <p className="font-bold">Recarregar DaystreakShield?</p>
  //       <button
  //         className="bg-green-600 p-1.5 rounded text-zinc-200 font-bold"
  //         onClick={() => confirmBuy(t.id, id)}
  //       >
  //         Confirmar
  //       </button>
  //     </div>
  //   ));
  // };

  const handleUpdateChampionData = useHandleUpdateChampionData();
  const { data: session } = useSession();

  const {
    globalState: { champion },
  } = useGlobalState();

  const handleFillDaystreakShield = async () => {
    toast((t) => (
      <div className="flex justify-center items-center gap-3">
        <p>Comprar item?</p>
        <button
          className="bg-green-700 p-3 rounded text-white font-bold"
          onClick={() => confirmBuy(t.id, 1)}
        >
          Confirmar
        </button>
      </div>
    ));
  };

  const confirmBuy = async (toastId, itemId) => {
    const token = session.accessToken;
    const { id } = champion;

    buyItem({ token, itemId, id })
      .then((buyed) => {
        if (buyed) {
          toast.success("DaystreakShield aumentou +1", { duration: 1000 });
          toast.dismiss(toastId);
        } else {
          toast.dismiss(toastId);
          toast.error("Limite alcançado! (3)");
        }
      })
      .then(() => {
        handleUpdateChampionData(id, token);
      })
      .catch((error) => {
        toast.error("Houve um erro ao comprar o item.", { duration: 1000 });
        toast.dismiss(toastId);
      });
  };

  useEffect(() => {}, [champion]);

  return (
    <div className="flex gap-2">
      <div>
        <Tooltip
          title={"TobiasCoins"}
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
          placement="bottom"
          className="flex justify-between cursor-default"
        >
          <span className="flex  items-center cursor-default gap-[0.200rem] ">
            <Image src={tobiasCoin} alt={"tobiasCoin image"} className="w-5" />
            <p className="font-bold text-xs opacity-50 hover:opacity-80">
              {tobiasCoins}
            </p>
          </span>
        </Tooltip>
      </div>

      <div>
        <Tooltip
          title={"Pts. de Experiência"}
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
          placement="bottom"
          className="flex justify-between cursor-default"
        >
          <span className="flex   items-center cursor-default gap-0 ">
            <Image src={xpImage} alt={"xp image"} className="w-5" />
            <p className="font-bold text-xs opacity-50 hover:opacity-80">
              {xp}
            </p>
          </span>
        </Tooltip>
      </div>

      <div>
        <Tooltip
          title={"Level"}
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
          placement="bottom"
          className="flex justify-between cursor-default"
        >
          <span className="flex  items-center cursor-default gap-[0.200rem] ">
            <Image src={levelImage} alt={"level image"} className="w-5" />
            <p className="font-bold text-xs opacity-50 hover:opacity-80">
              {level}
            </p>
          </span>
        </Tooltip>
      </div>

      <div>
        <Tooltip
          title={"Sequência atual"}
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
          placement="bottom"
          className="flex justify-between cursor-default"
        >
          <span className="flex  items-center cursor-default gap-[0.200rem] ">
            <Image
              src={daystreakImage}
              alt={"daystreak image"}
              className="w-5"
            />
            <p className="font-bold text-xs opacity-50 hover:opacity-80">
              {daystreak}
            </p>
          </span>
        </Tooltip>
      </div>

      <div>
        <Tooltip
          title={"Daystreak Shield"}
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
          placement="bottom"
          className="flex justify-between cursor-default"
        >
          <span
            className="flex  items-center gap-[0.200rem] cursor-pointer"
            onClick={() => handleFillDaystreakShield()}
          >
            <Image
              src={
                daystreakShield > 0
                  ? daystreakShieldImage
                  : daystreakShieldBroken
              }
              alt={"daystreak image"}
              className="w-5"
            />
            <p className="font-bold text-xs opacity-50 hover:opacity-80">
              {daystreakShield}
            </p>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default MiniStatistics;
