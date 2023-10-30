"use client";

import React from "react";
import { SendHorizontal, StepBack, StepForward, X } from "lucide-react";

const ActualGoalsScrollBar = () => {
  const goalList = [
    "goal1",
    "goal2",
    "goal3",
    "goal4",
    "goal5",
    "goal6",
    "goal7",
    "goal8",
  ];

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
          {goalList.map((_, i) => (
            <div className="bg-zinc-950 w-52 rounded-lg box-border" key={i}>
              <div className="flex justify-end m-1">
                <X
                  className="bg-white text-red-900 rounded opacity-20 hover:opacity-100 cursor-pointer"
                  strokeWidth={3}
                />
              </div>

              <div className=" p-6 py-2 rounded-lg box-border">
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Objetivo</p>
                  <p className="font-bold opacity-80">Correr</p>
                </span>
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Tipo</p>
                  <p className="font-bold opacity-80">Anual</p>
                </span>
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Meta</p>
                  <p className="font-bold opacity-80">120</p>
                </span>
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Mensal</p>
                  <p className="font-bold opacity-80">10</p>
                </span>
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Semanal</p>
                  <p className="font-bold opacity-80">2.5</p>
                </span>
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Diario</p>
                  <p className="font-bold opacity-80">0.357</p>
                </span>
                <span className="flex justify-between border-b">
                  <p className="font-extrabold">Atual</p>
                  <p className="font-bold opacity-80">120</p>
                </span>
              </div>
              <div className="flex gap-1 p-1.5">
                <input
                  className="w-[9.5rem] py-1 rounded-lg  bg-zinc-400 text-center text-zinc-900 font-bold text-base placeholder-zinc-600"
                  placeholder="Progresso"
                />
                <button className="p-2  bg-green-950 rounded hover:bg-green-900 justify-center items-center">
                  <SendHorizontal width={"1.6rem"} />
                </button>
              </div>
            </div>
          ))}
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
