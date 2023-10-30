import Link from "next/link";
import Image from "next/image";
import React from "react";

const SelectChampionPage = () => {
  const champions = [
    "campeao1",
    "campeao2",
    "campeao3",
    "campeao4",
    "campeao5",
    "campeao6",
    "campeao7",
    "campeao8",
    "campeao9",
    "campeao10",
    "campeao11",
    "campeao12",
    "campeao5",
    "campeao6",
    "campeao7",
    "campeao8",
    "campeao9",
    "campeao10",
    "campeao11",
    "campeao12",
  ];

  return (
    <div className="min-h-screen grid grid-cols-12 justify-center ">
      <div className="min-h-screen grid grid-cols-2 pb-24  sm:grid-cols-4 col-span-full gap-3 p-6">
        {champions.map((champion) => (
          <Link
            href="/champions/id"
            className=" flex justify-center items-center "
            key={champion}
          >
            <div>
              <Image
                src={`/championImages/holyTobs${Math.floor(
                  Math.random() * 4
                )}.webp`}
                alt={champion}
                width={300}
                height={100}
                className="hover:invert  hover:cursor-pointer rounded-lg"
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SelectChampionPage;
