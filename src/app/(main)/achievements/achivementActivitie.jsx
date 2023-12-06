import React from "react";

const activitieSummary = {
  Destreza: [
    {
      set: "kmRun",
      display: "Corrida",
    },
    {
      set: "jumpRope",
      display: "Salto de corda",
    },
    {
      set: "kmBike",
      display: "Bike",
    },
  ],
  Força: [
    {
      set: "upperLimb",
      display: "Superior",
    },
    {
      set: "abs",
      display: "Abdominal",
    },
    {
      set: "lowerLimb",
      display: "Inferior",
    },
  ],
  Inteligência: [
    {
      set: "study",
      display: "Estudo",
    },
    {
      set: "meditation",
      display: "Meditação",
    },
    {
      set: "reading",
      display: "Leitura",
    },
  ],
  Constituição: [
    {
      set: "meals",
      display: "Refeições",
    },
    {
      set: "drinks",
      display: "Água",
    },
    {
      set: "sleep",
      display: "Sono",
    },
  ],
  Sabedoria: [
    {
      set: "wisdom",
      display: "Sabedoria",
    },
  ],
};

const achivementActivitie = ({
  sumary,
  setSumaryActivitie,
  setShowAchievements,
}) => {
  return (
    <div>
      <ul className="bg-zinc-950 flex justify-between text-center p-2 rounded-lg font-extrabold ">
        {activitieSummary[sumary].map((activitie) => (
          <li
            className="flex-grow py-2 lg:py-4 text-sm text-white/50 hover:text-white hover:bg-zinc-900 cursor-pointer rounded-lg "
            onClick={() => {
              setShowAchievements(true);
              setSumaryActivitie(activitie.set);
            }}
          >
            {activitie.display}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default achivementActivitie;
