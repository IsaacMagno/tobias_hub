"use client";
import React, { useState } from "react";
import ItemCategory from "./ItemCategory";
import ItemFilter from "./ItemFilter";
import ItemList from "./ItemList";

const page = () => {
  const [marketSelected, setMarketSelected] = useState("Tobias");
  const [showItemFilter, setShowItemFilter] = useState(false);

  return (
    <div className="flex flex-col-reverse lg:grid lg:grid-cols-4 pb-20 lg:pb-0">
      {/* Display */}
      <div className="col-span-full lg:col-span-3 bg-zinc-800 lg:rounded-l-lg">
        <div className="flex bg-zinc-950 justify-evenly p-3 lg:rounded-tl-lg">
          <span
            className="text-sm lg:text-base font-extrabold opacity-50 hover:opacity-100"
            onClick={() => setMarketSelected("Champions")}
          >
            Empório dos Campeões
          </span>
          <span
            className="text-sm lg:text-base font-extrabold opacity-50 hover:opacity-100"
            onClick={() => setMarketSelected("Tobias")}
          >
            Armazém do Tobias
          </span>
        </div>
        <div className="grid grid-cols-4 bg-zinc-800 justify-evenly p-3">
          <span className="col-span-2 rounded-lg w-32 ml-4  font-extrabold text-sm opacity-50 hover:opacity-100">
            Nome
          </span>
          <span className="rounded-lg w-32  font-extrabold text-sm opacity-50 hover:opacity-100">
            Categoria
          </span>
          <span className="rounded-lg w-32  font-extrabold text-sm opacity-50 hover:opacity-100">
            Preço médio
          </span>
        </div>
        <ItemList marketSelected={marketSelected} />
      </div>
      <div className="col-span-full lg:col-span-1 lg:min-h-screen bg-zinc-950 p-2 rounded-r-lg">
        {/* Item category */}
        <ItemCategory />
        {/* Primary characteristics */}
        <div className="bg-zinc-600 mt-2 p-1 rounded mb-2">
          <span
            className="font-bold text-xl"
            onClick={() => setShowItemFilter(!showItemFilter)}
          >
            Características
          </span>
          {showItemFilter ? <ItemFilter /> : null}
        </div>
      </div>
    </div>
  );
};

export default page;
