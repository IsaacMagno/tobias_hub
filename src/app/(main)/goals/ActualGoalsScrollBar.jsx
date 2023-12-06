"use client";

import React, { useEffect, useState } from "react";
import { SendHorizontal, StepBack, StepForward, X } from "lucide-react";
import { deleteGoal, updateGoal } from "../../services/requests";
import toast from "react-hot-toast";
import { useHandleUpdateChampionData } from "../../hooks/useHandleUpdateChampionData";
import { goalsVincKeyToName } from "./goalsVinc";

const ActualGoalsScrollBar = ({
  goalList,
  setGoalList,
  token,
  champion_id,
}) => {
  const [goalUpdate, setGoalUpdate] = useState({});
  const [actualGoalList, setActualGoalList] = useState();
  const handleUpdateChampionData = useHandleUpdateChampionData();

  useEffect(() => {
    setActualGoalList(goalList.filter((goal) => !goal.completed));
  }, [goalList]);

  const sliderFunction = (side) => {
    var slider = document.getElementById("slider");
    if (slider != null) {
      if (side == "left") {
        slider.scrollLeft = slider.scrollLeft - 215;
      } else if (side == "right") {
        slider.scrollLeft = slider.scrollLeft + 215;
      }
    }
  };

  const handleInputChange = (id, value) => {
    setGoalUpdate((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleUpdateGoal = async (id) => {
    const { updatedGoal } = await updateGoal(token, goalUpdate[id], id);

    setGoalList((prevGoals) =>
      prevGoals.map((goal) => (goal.id === id ? updatedGoal : goal))
    );

    setGoalUpdate((prevState) => ({ ...prevState, [id]: "" }));
  };

  const handleDeleteGoal = async (id) => {
    toast((t) => (
      <div className="flex justify-center">
        <p>Tem certeza de que deseja deletar essa meta?</p>
        <button
          className="bg-red-500 p-3 rounded text-white font-bold"
          onClick={() => confirmDelete(t.id, id)}
        >
          Confirmar
        </button>
      </div>
    ));
  };

  const confirmDelete = async (toastId, goalId) => {
    deleteGoal(token, goalId)
      .then(() => {
        toast.success("A meta foi deletada com sucesso!", { duration: 1000 });
        toast.dismiss(toastId);
      })
      .then(() => {
        handleUpdateChampionData(champion_id, token);
      })
      .catch((error) => {
        toast.error("Houve um erro ao deletar a meta.", { duration: 1000 });
        toast.dismiss(toastId);
      });
  };

  const vincGoalTranslate = (goalVinc) => {
    return goalsVincKeyToName[goalVinc];
  };

  return (
    <>
      <div className="relative flex justify-center items-center bg-zinc-800 rounded-xl">
        <StepBack
          className="hidden sm:block opacity-50 cursor-pointer hover:opacity-100"
          size={40}
          onClick={() => sliderFunction("left")}
        />
        <div
          id="slider"
          className="md:max-w-[25rem] xl:max-w-[40rem] w-full h-full overflow-x-scroll scroll whitespace-nowrap scroll-smooth my-2 flex gap-2 rounded-lg"
        >
          {actualGoalList && actualGoalList.length ? (
            actualGoalList.map((goal, i) => (
              <div
                className="bg-zinc-950 w-[13.1rem] rounded-lg box-border"
                key={i}
              >
                <div
                  className="flex justify-end m-1"
                  onClick={() => handleDeleteGoal(goal.id)}
                >
                  <X
                    className="bg-white text-red-900 rounded opacity-20 hover:opacity-100 cursor-pointer"
                    strokeWidth={3}
                  />
                </div>

                <div className=" p-6 py-2 rounded-lg box-border">
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Objetivo</p>
                    <p className="font-bold opacity-80 text-xs ">{goal.name}</p>
                  </span>
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Tipo</p>
                    <p className="font-bold opacity-80 text-xs ">{goal.type}</p>
                  </span>
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Meta</p>
                    <p className="font-bold opacity-80 text-xs ">{goal.goal}</p>
                  </span>
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Mensal</p>
                    <p className="font-bold opacity-80 text-xs ">
                      {goal.month}
                    </p>
                  </span>
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Semanal</p>
                    <p className="font-bold opacity-80 text-xs ">{goal.week}</p>
                  </span>
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Diario</p>
                    <p className="font-bold opacity-80 text-xs ">
                      {goal.daily}
                    </p>
                  </span>
                  <span className="flex justify-between border-b items-center">
                    <p className="text-sm font-extrabold">Atual</p>
                    <p className="font-bold opacity-80 text-xs ">
                      {goal.actual}
                    </p>
                  </span>
                  {goal.link && (
                    <span className="flex justify-between border-b items-center mb-8">
                      <p className="text-sm font-extrabold">Vinculado</p>
                      <p className="font-bold opacity-80 text-xs ">
                        {vincGoalTranslate(goal.link)}
                      </p>
                    </span>
                  )}
                </div>
                {!goal.link && (
                  <div className="flex gap-1 p-1.5">
                    <input
                      className="w-[9.5rem] py-1 rounded-lg  bg-zinc-400 text-center text-zinc-900 font-bold text-sm placeholder-zinc-600 outline-none shadow-none"
                      placeholder="Progresso"
                      value={goalUpdate[goal.id] || ""}
                      onChange={({ target }) =>
                        handleInputChange(goal.id, target.value)
                      }
                    />
                    <button
                      className="p-2  bg-green-950 rounded hover:bg-green-900 justify-center items-center"
                      onClick={() => handleUpdateGoal(goal.id)}
                    >
                      <SendHorizontal width={"1.6rem"} />
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center flex-grow">
              Você ainda não criou nenhuma meta
            </div>
          )}
        </div>
        <StepForward
          className="hidden sm:block opacity-50 cursor-pointer hover:opacity-100"
          size={40}
          onClick={() => sliderFunction("right")}
        />
      </div>
    </>
  );
};

export default ActualGoalsScrollBar;
