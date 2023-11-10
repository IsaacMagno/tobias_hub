"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { baseUrl, getChampionsImages } from "../../services/requests";

const SelectChampionPage = () => {
  const [champions, setChampions] = useState();

  useEffect(() => {
    const getChampionsImgs = async () => {
      const champImgs = await getChampionsImages();
      setChampions(champImgs);
    };

    getChampionsImgs();
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-12 justify-center ">
      <div className="min-h-screen grid grid-cols-2 pb-24  sm:grid-cols-4 col-span-full gap-3 p-6">
        {champions &&
          champions.map((champion) => (
            <Link
              href={`/champions/${champion.champion_id}`}
              key={champion.champion_id}
            >
              <div className="flex justify-center items-center">
                <Image
                  src={`${baseUrl}/images/${champion.image}`}
                  alt={champion}
                  width={300}
                  height={100}
                  className="hover:invert  hover:cursor-pointer rounded-lg min-h-[15.5rem]"
                />
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default SelectChampionPage;
