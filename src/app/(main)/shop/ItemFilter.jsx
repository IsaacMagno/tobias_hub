import Image from "next/image";
import React from "react";

import AP from "/public/shopIcons/pa.webp";
import PM from "/public/shopIcons/pm.webp";
import wis from "/public/shopIcons/wis.webp";
import str from "/public/shopIcons/str.webp";
import int from "/public/shopIcons/int.webp";
import dex from "/public/shopIcons/dex.webp";
import con from "/public/shopIcons/con.webp";
import range from "/public/shopIcons/range.webp";

const ItemFilter = () => {
  return (
    <div className="flex flex-col  ">
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Ponto de Ação</span>
        </div>
        <Image src={AP} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Ponto de Movimento</span>
        </div>
        <Image src={PM} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Alcance</span>
        </div>
        <Image src={range} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Destreza</span>
        </div>
        <Image src={dex} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Força</span>
        </div>
        <Image src={str} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Inteligência</span>
        </div>
        <Image src={int} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Constituição</span>
        </div>
        <Image src={con} alt="ap image" />
      </div>
      <div className="flex justify-between items-center gap-1">
        <div className="flex gap-2">
          <input type="checkbox" />
          <span className="font-bold text-sm">Sabedoria</span>
        </div>
        <Image src={wis} alt="ap image" />
      </div>
    </div>
  );
};

export default ItemFilter;
