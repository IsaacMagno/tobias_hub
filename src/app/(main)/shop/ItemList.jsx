"use client";
import React, { useState, useEffect } from "react";
import ItemCard from "./ItemCard";

const ItemList = ({ marketSelected }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (marketSelected === "Champions") {
      fetch("/data/championsStore.json")
        .then((response) => response.json())
        .then((data) => setItems(data));
    } else if (marketSelected === "Tobias") {
      fetch("/data/tobiasStore.json")
        .then((response) => response.json())
        .then((data) => setItems(data));
    }
  }, [marketSelected]);

  return (
    <div className="flex flex-col gap-2 overflow-y-scroll  max-h-[45rem] px-4  py-1 rounded-lg">
      {items.map((item, index) => (
        <ItemCard {...item} key={index} />
      ))}
    </div>
  );
};

export default ItemList;
