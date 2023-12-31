"use client";
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { baseUrl, getChampionsImages } from "../../services/requests";
import Loading from "../loading";

const SelectChampionPage = () => {
  const [champions, setChampions] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getChampionsImgs = async () => {
      const champImgs = await getChampionsImages();
      setChampions(champImgs);
      setIsLoading(false);
    };

    getChampionsImgs();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen grid grid-cols-12 justify-center ">
      <div className="min-h-screen grid grid-cols-2 pb-24  sm:grid-cols-4 col-span-full gap-3 p-6">
        {champions &&
          champions.map((champion) => (
            <Link
              href={`/champions/${champion.champion_id}`}
              key={champion.champion_id}
            >
              <div className="relative  h-[35vh]">
                <Image
                  src={`${baseUrl}/images/${champion.image}`}
                  alt={champion}
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full hover:invert grayscale contrast-100 brightness-50  hover:cursor-pointer rounded-lg"
                />
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default SelectChampionPage;
