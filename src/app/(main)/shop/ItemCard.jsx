import Image from "next/image";
import React, { useState } from "react";

import tobiasCoin from "/public/userstreak/tobiasCoin.svg";

function ItemCard(item) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div
      className="grid grid-cols-4 bg-zinc-900 p-2 rounded-lg gap-2 items-center"
      onClick={() => setShowMore(!showMore)}
    >
      <div className="flex col-span-2 items-center">
        <Image src={item.image} alt="item image" width={55} height={55} />
        <span className="font-bold text-xs lg:text-sm lg:font-extrabold pl-4">
          {item.name}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-xs lg:text-sm lg:font-extrabold">
          {item.category}
        </span>
      </div>
      <div className="flex gap-2 items-center">
        <Image alt="tobiasCoin" src={tobiasCoin} className="w-4 lg:w-7" />

        <span className="font-bold text-xs lg:text-sm lg:font-extrabold">
          {item.price}
        </span>
      </div>
      {showMore ? (
        <div className="col-span-full grid lg:grid-cols-4  bg-zinc-700 pb-4 rounded-lg">
          <div className="flex flex-col pl-4 col-span-2">
            <p className="font-extrabold py-2 text-sm lg:text-base">
              Descrição
            </p>
            <p className="text-xs lg:text-sm">{item.description}</p>
          </div>

          <div className="flex flex-col pl-4 lg:pl-0">
            <p className="font-extrabold py-2 text-sm lg:text-base">
              Características
            </p>
            {Object.entries(item.characteristics).map(([key, value]) => {
              if (value > 0) {
                return (
                  <p
                    className="font-bold text-xs lg:text-sm"
                    key={key}
                  >{`${key}: ${value}`}</p>
                );
              }
              return null;
            })}
          </div>

          <div className="flex flex-col">
            <p className="font-extrabold py-2 text-sm lg:text-base">
              Requisitos
            </p>
            {Object.entries(item.requirements).map(([key, value]) => {
              if (value > 0) {
                return (
                  <p
                    className="font-bold text-xs lg:text-sm"
                    key={key}
                  >{`${key}: ${value}`}</p>
                );
              }
              return null;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ItemCard;

// js
