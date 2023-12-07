import React, { useEffect, useState } from "react";
import Image from "next/image";

import Loading from "../../loading";
import { updateActivitie, updateDaystreak } from "../../../services/requests";
import { useGlobalState } from "../../../services/state";

import air from "/public/elementIcons/air.svg";
import fire from "/public/elementIcons/fire.svg";
import water from "/public/elementIcons/water.svg";
import earth from "/public/elementIcons/earth.svg";

const activitesTypes = {
  dexterity: {
    name: "Destreza",
    activitiesImages: [
      ["activitiesIcons/run.svg", "Km Corridos", "kmRun"],
      ["activitiesIcons/rope.svg", "Saltos de corda", "jumpRope"],
      ["/activitiesIcons/bike.svg", "Km Pedalados", "kmBike"],
    ],
  },
  strength: {
    name: "Força",
    activitiesImages: [
      ["activitiesIcons/upper.svg", "Treino superior", "upperLimb"],
      ["activitiesIcons/abs.svg", "Treino abdominal", "abs"],
      ["/activitiesIcons/lower.svg", "Treino inferior", "lowerLimb"],
    ],
  },
  intelligence: {
    name: "Inteligência",
    activitiesImages: [
      ["activitiesIcons/study.svg", "Horas estudadas", "study"],
      ["activitiesIcons/meditation.svg", "Horas meditando", "meditation"],
      ["/activitiesIcons/reading.svg", "Horas lendo", "reading"],
    ],
  },
  constitution: {
    name: "Constituição",
    activitiesImages: [
      ["activitiesIcons/meals.svg", "Refeições saudáveis", "meals"],
      ["activitiesIcons/drinks.svg", "Litros de água", "drinks"],
      ["/activitiesIcons/sleep.svg", "Horas de sono", "sleep"],
    ],
  },
};

const ActivitiesIncrease = ({ championId, token }) => {
  const { globalState, setGlobalState } = useGlobalState();

  const [selectedActivitie, setSelectedActivitie] = useState();
  const [activitieValue, setActivitieValue] = useState();
  const [activitieIntensity, setActivitieIntensity] = useState();
  const [activitiePlaceholder, setActivitiePlaceholder] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [activitiesData, setActivitiesData] = useState();
  const [bgColor, setBgColor] = useState("bg-green-500");

  useEffect(() => {
    if (activitiesData) {
      setActivitiePlaceholder(activitiesData.activitiesImages[0][1]);
      setSelectedActivitie(activitiesData.activitiesImages[0][2]);
    }
  }, [activitiesData]);

  useEffect(() => {
    if (!selectedActivitie || !activitieValue || !activitieIntensity) {
      setDisabled(true);
    } else {
      setDisabled(false);
    }

    if (activitiesData && activitiesData.name === "Constituição") {
      if (!selectedActivitie || !activitieValue) {
        setDisabled(true);
      } else {
        setDisabled(false);
      }
    }
  }, [selectedActivitie, activitieValue, activitieIntensity]);

  useEffect(() => {
    setActivitiesData(activitesTypes.dexterity);
  }, []);

  const handleUpdateActivitie = async () => {
    setIsLoading(true);

    await updateDaystreak(championId, token);

    const { championUpdated } = await updateActivitie({
      championId,
      selectedActivitie,
      activitieIntensity,
      activitieValue,
      token,
    });

    setGlobalState({
      ...globalState,
      champion: championUpdated,
    });

    setActivitieValue();
    setActivitieIntensity();
    setIsLoading(false);
  };

  return (
    <div className="flex justify-center items-center gap-4 p-3">
      <div className="flex flex-col gap-2">
        <button
          className="bg-green-500 flex p-0.5 lg:p-3 rounded-lg hover:opacity-70"
          onClick={() => {
            setActivitiesData(activitesTypes.dexterity);
            setBgColor("bg-green-500");
          }}
        >
          <Image src={air} className="w-10 lg:w-6 opacity-50" alt="air" />
        </button>

        <button
          className="bg-yellow-500 flex p-0.5 lg:p-3 rounded-lg hover:opacity-70"
          onClick={() => {
            setActivitiesData(activitesTypes.strength);
            setBgColor("bg-yellow-500");
          }}
        >
          <Image src={earth} className="w-10 lg:w-6 opacity-50" alt="earth" />
        </button>
        <button
          className="bg-red-500 flex p-0.5 lg:p-3 rounded-lg hover:opacity-70"
          onClick={() => {
            setActivitiesData(activitesTypes.intelligence);
            setBgColor("bg-red-500");
          }}
        >
          <Image src={fire} className="w-10 lg:w-6 opacity-50" alt="fire" />
        </button>
        <button
          className="bg-blue-500 flex p-0.5 lg:p-3 rounded-lg hover:opacity-70"
          onClick={() => {
            setActivitiesData(activitesTypes.constitution);
            setBgColor("bg-blue-500");
          }}
        >
          <Image src={water} className="w-10 lg:w-6 opacity-50" alt="water" />
        </button>
      </div>
      <div
        className={`flex ${bgColor} h-56 w-96 rounded-lg p-4 justify-center`}
      >
        <div className="min-w-full flex gap-1  relative">
          {isLoading ? (
            <div className="min-w-full flex items-center justify-center">
              <Loading
                textColor="text-white"
                opacity="100"
                textSize="text-xl"
                barWidth="200"
                barHeight="60"
              />
            </div>
          ) : (
            activitiesData && (
              <>
                <p className=" text-zinc-950  font-extrabold text-3xl text-center absolute top-0 opacity-70">
                  {activitiesData.name}
                </p>

                <div className="flex flex-col justify-center flex-grow ">
                  <div className="flex">
                    <input
                      type="number"
                      className="p-2 rounded-l-lg w-[6.5rem] lg:w-[10.5rem] text-black"
                      placeholder={activitiePlaceholder}
                      value={activitieValue}
                      onChange={({ target }) => setActivitieValue(target.value)}
                    />
                    <select
                      className="bg-zinc-800 font-bold rounded-r-lg w-[6.5rem]"
                      value={activitieIntensity}
                      onChange={({ target }) =>
                        setActivitieIntensity(target.value)
                      }
                      disabled={
                        activitiesData.name === "Constituição" ? true : false
                      }
                    >
                      <option value="" disabled selected>
                        Intensidade
                      </option>
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                </div>
                <button
                  className={`
                ${
                  disabled ? "bg-zinc-700" : "bg-zinc-900"
                } rounded-lg p-3 py-1.5 mt-2 w-20 absolute bottom-0
              `}
                  onClick={() => handleUpdateActivitie()}
                  disabled={disabled}
                >
                  Enviar
                </button>

                <div className="flex flex-col gap-6 justify-center">
                  {activitiesData.activitiesImages.map((actImg) => (
                    <Image
                      src={actImg[0]}
                      className={`w-12 bg-zinc-100 rounded-full p-1.5 bg-opacity-80 border-zinc-800 border cursor-pointer ${
                        selectedActivitie === actImg[2]
                          ? "bg-zinc-400"
                          : "hover:bg-opacity-60 "
                      }`}
                      alt="run"
                      onClick={() => {
                        setActivitiePlaceholder(actImg[1]);
                        setSelectedActivitie(actImg[2]);
                      }}
                      width={0}
                      height={0}
                      size={"100vw"}
                      key={actImg[2]}
                    />
                  ))}
                </div>
                {/* <div className="flex flex-col gap-6 justify-center">
                  {activitiesData.activitiesImages.map((actImg) => (
                    <Image
                      src={actImg[0]}
                      className="w-12 bg-white rounded-full p-1.5 bg-opacity-80 hover:bg-zinc-300 border-zinc-800 border cursor-pointer"
                      alt="run"
                      onClick={() => {
                        setActivitiePlaceholder(actImg[1]);
                        setSelectedActivitie(actImg[2]);
                      }}
                      width={0}
                      height={0}
                      size={"100vw"}
                      key={actImg[2]}
                    />
                  ))}
                </div> */}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivitiesIncrease;
