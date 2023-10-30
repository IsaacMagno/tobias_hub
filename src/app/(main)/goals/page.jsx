"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";

import GoalsIcon from "/public/goalsIcons/goals.svg";
import MiniStatistics from "../components/LayoutComponents/MiniStatistics";
import ActualGoalsScrollBar from "./ActualGoalsScrollBar";
import Dropdown from "../components/Dropdown";

const page = () => {
  const [goalTime, setGoalTime] = useState("Anual");
  const [goalType, setGoalType] = useState("Stats");
  const [goalVinc, setGoalVinc] = useState("Vinculo");
  const [vincArray, setVincArray] = useState([""]);

  const [showGoalTime, setShowGoalTime] = useState(false);
  const [showGoalType, setShowGoalType] = useState(false);
  const [showGoalVinc, setShowGoalVinc] = useState(false);

  useEffect(() => {
    const handleChangeType = () => {
      let newVincArray = [];

      switch (goalType) {
        case "DEX":
          newVincArray = ["Km corridos", "Saltos de corda", "Km pedalados"];
          setGoalVinc("Vinculo");

          break;
        case "STR":
          newVincArray = [
            "Treino superior",
            "Treino abdominal",
            "Treino inferior",
          ];
          setGoalVinc("Vinculo");
          break;
        case "INT":
          newVincArray = ["Horas estudando", "Horas meditando", "Horas lendo"];
          setGoalVinc("Vinculo");
          break;
        case "CON":
          newVincArray = ["Horas de sono", "Litros de água", "Ref. saudáveis"];
          setGoalVinc("Vinculo");
          break;
        case "Nenhum":
          newVincArray = [];
          setGoalVinc("Vinculo");
          break;
      }

      setVincArray(newVincArray);
    };

    handleChangeType();
  }, [goalType]);

  const disableActiveDropdowns = () => {
    if (showGoalVinc) setShowGoalVinc(false);
    if (showGoalTime) setShowGoalTime(false);
    if (showGoalType) setShowGoalType(false);
  };

  const goalsCompleted = [
    { name: "Correr 120km", date: "19/10/2023" },
    { name: "Ler 5 livros", date: "22/05/2023" },
    { name: "Investir R$ 10.000,00", date: "03/04/2023" },
  ];

  return (
    <div className="flex flex-col-reverse md:flex-row  md:gap-6 justify-center lg:pr-80 lg:min-h-screen lg:box-content ">
      <div className="flex flex-col flex-grow gap-3">
        <div className="py-2 px-2 lg:px-24 box-border flex bg-zinc-950 justify-center rounded-xl">
          <div className=" max-w-2xl  flex flex-grow flex-col shadow-md ">
            <div className="flex justify-evenly">
              <Image
                src={GoalsIcon}
                alt="goals icon"
                className="w-36 lg:w-48"
              />

              <div className="flex flex-col gap-2 py-2">
                <div
                  className=""
                  onClick={() => {
                    setShowGoalType(!showGoalType), disableActiveDropdowns();
                  }}
                >
                  <Dropdown
                    show={showGoalType}
                    optionsText={["DEX", "STR", "INT", "CON", "Nenhum"]}
                    handleChange={setGoalType}
                    placeholder={goalType}
                  />
                </div>
                <div
                  className=""
                  onClick={() => {
                    setShowGoalVinc(!showGoalVinc), disableActiveDropdowns();
                  }}
                >
                  <Dropdown
                    show={showGoalVinc}
                    optionsText={vincArray}
                    handleChange={setGoalVinc}
                    placeholder={goalVinc}
                  />
                </div>
                <div>
                  <input
                    className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base appearance-none outline-none border-2 border-zinc-950 text-zinc-800"
                    placeholder="Objetivo"
                  />
                </div>
                <div>
                  <input
                    className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base appearance-none outline-none border-2 border-zinc-950 text-zinc-800"
                    placeholder="Meta"
                  />
                </div>
                <div
                  className=""
                  onClick={() => {
                    setShowGoalTime(!showGoalTime), disableActiveDropdowns();
                  }}
                >
                  <Dropdown
                    show={showGoalTime}
                    optionsText={["Anual", "Mensal"]}
                    handleChange={setGoalTime}
                    placeholder={goalTime}
                  />
                </div>

                <div>
                  <button className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base border-2 border-black bg-zinc-600 hover:bg-zinc-600/90">
                    Criar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="block pb-24 lg:pb-0">
          <ActualGoalsScrollBar />
        </div>
      </div>
      {/* SIDE BAR */}
      <section className="w-full h-full pb-4 lg: lg:pb-28 userstats-md userstats-lg bg-zinc-900 lg:border-l-0 mx-2">
        <div className="my-4 mr-4 flex justify-center lg:block">
          <MiniStatistics />
        </div>
        <div className="h-full flex flex-col gap-2  max-h-[25rem]  border rounded-lg p-2 mr-3.5 lg:mr-0">
          <span className="flex justify-between items-center ">
            <h1 className="w-1 font-extrabold">Metas Alcançadas</h1>
            <h1 className="opacity-50 font-extrabold hover:opacity-80">
              Ver todas
            </h1>
          </span>
          <span className="flex">
            <ul className="min-w-full">
              {goalsCompleted.map((goal, index) => (
                <li className="font-light text-xs" key={index}>
                  <span className="flex justify-between">
                    <p>{goal.name}</p>
                    <p>{goal.date}</p>
                  </span>
                </li>
              ))}
            </ul>
          </span>
        </div>
      </section>
    </div>
  );
};

export default page;
