"use client";
import React, { useState, useEffect } from "react";
import ItemCard from "./ItemCard";
import Loading from "../loading";

const ItemList = ({ marketSelected }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (marketSelected === "Champions") {
      fetch(`${baseUrl}/items/championsStore`)
        .then((response) => response.json())
        .then((data) => setItems(data.items));
    } else if (marketSelected === "Tobias") {
      fetch(`${baseUrl}/items/tobiasStore`)
        .then((response) => response.json())
        .then((data) => setItems(data.items));
    }

    setIsLoading(false);
  }, [marketSelected]);

  if (isLoading) return <Loading />;

  return (
    <div className="flex  gap-2 overflow-y-scroll  max-h-[45rem] px-4  py-1 rounded-lg justify-center lg:justify-normal">
      {items.map((item, index) => (
        <ItemCard {...item} key={index} />
      ))}
    </div>
  );
};

export default ItemList;
