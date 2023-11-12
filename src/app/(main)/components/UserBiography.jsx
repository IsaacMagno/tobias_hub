"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import MiniStatistics from "./LayoutComponents/MiniStatistics";
import { getQuote, baseUrl } from "../../services/requests";

const UserBiography = ({ displayBio, userData }) => {
  const [quotes, setQuotes] = useState();
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    const fetchQuote = async () => {
      const { quote } = await getQuote();
      setQuotes(quote);
    };

    fetchQuote();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex flex-row justify-between gap-2 pb-3 border-b-2">
      <div className="flex-1 flex-col">
        <div className="flex flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold">{userData.name}</h1>
            <p className="text-lg font-semibold opacity-80">{userData.title}</p>
          </div>

          {windowSize.width <= 639 && (
            <div className="flex justify-center items-center ">
              <Image
                className="w-20 h-20 rounded-full border-2"
                alt={"Monkey Image"}
                src={`${baseUrl}/images/${userData.files.image}`}
                width={0}
                height={0}
                sizes="100vw"
                priority
              />
            </div>
          )}
        </div>
        <div className="flex mt-4 max-w-xl lg:max-w-2xl ">
          {displayBio ? (
            <span className="text-sm">{userData.biography}</span>
          ) : (
            <span className="flex flex-col min-width-fill">
              {quotes ? (
                <div>
                  <p className="text-sm font-semibold opacity-80">
                    {quotes.quote}
                  </p>
                  <p className="text-sm mt-2 font-bold opacity-50">
                    {quotes.author}
                  </p>
                </div>
              ) : null}

              {windowSize.width <= 639 && (
                <div className="flex  justify-end">
                  <MiniStatistics
                    tobiasCoins={userData.tobiasCoins}
                    xp={userData.xp}
                    level={userData.level}
                    daystreak={userData.daystreak}
                    daystreakShield={userData.daystreakShield}
                  />
                </div>
              )}
            </span>
          )}
        </div>
      </div>
      {windowSize.width >= 640 && (
        <div className="flex justify-center items-center self-end">
          {displayBio ? (
            <Image
              className=" w-44 h-44 rounded-full border-2"
              alt={"Monkey Image"}
              src={`${baseUrl}/images/${userData.files.image}`}
              width={0}
              height={0}
              sizes="100vw"
            />
          ) : (
            <div className="">
              <div className="flex flex-col gap-2 items-center ">
                <Image
                  className=" w-44 h-44 rounded-full border-2"
                  alt={"Monkey Image"}
                  src={`${baseUrl}/images/${userData.files.image}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                />
                <MiniStatistics
                  tobiasCoins={userData.tobiasCoins}
                  xp={userData.xp}
                  level={userData.level}
                  daystreak={userData.daystreak}
                  daystreakShield={userData.daystreakShield}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserBiography;
