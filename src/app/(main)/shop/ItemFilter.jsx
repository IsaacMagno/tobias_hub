import Image from "next/image";
import React from "react";

import AP from "/public/shopIcons/pa.png";
import PM from "/public/shopIcons/pm.png";
import wis from "/public/shopIcons/wis.png";
import str from "/public/shopIcons/str.png";
import int from "/public/shopIcons/int.png";
import dex from "/public/shopIcons/dex.png";
import con from "/public/shopIcons/con.png";
import range from "/public/shopIcons/range.png";

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
