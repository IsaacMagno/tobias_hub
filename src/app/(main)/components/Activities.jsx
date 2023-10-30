"use client";
import React, { useState } from "react";
import Image from "next/image";

import userActivitiesImage from "/public/userStats/activities.svg";
import ratesImage from "/public/userStats/rate.svg";

const Activities = () => {
  const [showRate, setShowRate] = useState(false);

  return (
    <>
      <div className="flex items-center justify-evenly gap-2 my-4 ">
        <Image
          src={userActivitiesImage}
          alt="user stats"
          className="w-10 h-10"
        />

        <h1 className="text-xl font-semibold ">Atividades</h1>
        <Image
          src={ratesImage}
          className="w-5 hover:cursor-pointer hover:p-[1px]"
          alt="rates image"
          onClick={() => setShowRate(!showRate)}
        />
      </div>
      <ul className="list-none space-y-2">
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">Km Corridos</p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">5:1</p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Saltos de Corda
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                1800:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">Km Pedalados</p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                20:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Treino Superior
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                300:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Treino Abdominal
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                500:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Treino Inferior
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                300:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Refeições Saudáveis
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">8:1</p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">Litros de Água</p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                10:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">Horas de Sono</p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                240:1
              </p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Horas Estudando
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">8:1</p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">
              Horas Meditando
            </p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">2:1</p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
        <li>
          <span className="flex justify-between border-b">
            <p className="text-sm lg:text-[15px] font-medium">Horas Lendo</p>
            {showRate ? (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">3:1</p>
            ) : (
              <p className="text-sm lg:text-[15px] font-bold opacity-80">
                9999
              </p>
            )}
          </span>
        </li>
      </ul>
    </>
  );
};

export default Activities;
