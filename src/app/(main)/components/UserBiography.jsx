"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import MiniStatistics from "./LayoutComponents/MiniStatistics";
import { getQuote, baseUrl, updateChampionBio } from "../../services/requests";
import { useGlobalState } from "../../services/state";
import { Pencil, SendHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useHandleUpdateChampionData } from "../../hooks/useHandleUpdateChampionData";
import Loading from "../loading";

const UserBiography = ({ displayBio, userData }) => {
  const [championUpdatedData, setChampionUpdatedData] = useState();

  const handleUpdateChampionData = useHandleUpdateChampionData();

  const [editBioMode, setEditBioMode] = useState(false);
  const [editBioText, setEditBioText] = useState("");
  const [quotes, setQuotes] = useState();
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  });

  const { data: session } = useSession();

  const {
    globalState: { champion },
  } = useGlobalState();

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

    setChampionUpdatedData(userData);

    return () => window.removeEventListener("resize", handleResize);
  }, [userData]);

  const handleEditMode = async () => {
    if (editBioMode) {
      const token = session.accessToken;
      await updateChampionBio(championUpdatedData.id, editBioText, token);
      const championUpdated = await handleUpdateChampionData(
        championUpdatedData.id,
        token
      );
      setChampionUpdatedData(championUpdated);
    }

    setEditBioMode(!editBioMode);
  };

  return (
    championUpdatedData && (
      <div className="flex flex-row justify-between gap-2 pb-3 border-b-2">
        <div className="flex-1 flex-col">
          <div className="flex flex-row justify-between">
            <div>
              <h1 className="text-2xl font-bold">{championUpdatedData.name}</h1>
              <p className="text-lg font-semibold opacity-80">
                {championUpdatedData.title}
              </p>
            </div>

            {windowSize.width <= 639 && (
              <div className="flex justify-center items-center ">
                <Image
                  className="w-20 h-20 rounded-full border-2 grayscale contrast-100 brightness-50"
                  alt={"Monkey Image"}
                  src={`${baseUrl}/images/${championUpdatedData.files.image}`}
                  width={0}
                  height={0}
                  sizes="100vw"
                  priority
                />
              </div>
            )}
          </div>
          <div className="flex mt-4 max-w-xl lg:max-w-2xl">
            {displayBio ? (
              <div className="">
                {editBioMode ? (
                  <textarea
                    className="bg-zinc-950 flex "
                    onChange={({ target: { value } }) => setEditBioText(value)}
                    rows={2}
                    cols={50}
                  >
                    {championUpdatedData.biography}
                  </textarea>
                ) : (
                  <p className="text-sm mb-2">
                    {championUpdatedData.biography
                      .split("\n")
                      .map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                  </p>
                )}
              </div>
            ) : (
              // <span className="text-sm">{championUpdatedData.biography}</span>
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
                ) : (
                  <Loading
                    minHeight={false}
                    textSize={"text-sm"}
                    barWidth={100}
                    barHeight={50}
                  />
                )}

                {windowSize.width <= 639 && (
                  <div className="flex  justify-end">
                    <MiniStatistics
                      tobiasCoins={championUpdatedData.tobiasCoins}
                      xp={championUpdatedData.xp}
                      level={championUpdatedData.level}
                      daystreak={championUpdatedData.daystreak}
                      daystreakShield={championUpdatedData.daystreakShield}
                    />
                  </div>
                )}
              </span>
            )}
          </div>
          {displayBio && championUpdatedData.id === champion.id ? (
            <div className="flex justify-end">
              <span
                className="cursor-pointer py-1 px-2 bg-zinc-950 hover:bg-zinc-800 rounded"
                onClick={() => handleEditMode()}
              >
                {editBioMode ? (
                  <SendHorizontal width={15} />
                ) : (
                  <Pencil width={15} />
                )}
              </span>
            </div>
          ) : null}
        </div>
        {windowSize.width >= 640 && (
          <div className="flex justify-center items-center ">
            {displayBio ? (
              <div className="relative w-44 h-44">
                <Image
                  alt={"Monkey Image"}
                  src={`${baseUrl}/images/${championUpdatedData.files.image}`}
                  layout="fill"
                  objectFit="cover"
                  className="w-full h-full  grayscale contrast-100 brightness-50  rounded-full border-2"
                />
              </div>
            ) : (
              <div className="">
                <div className="flex flex-col gap-2 items-center ">
                  <div className="relative w-44 h-44">
                    <Image
                      alt={"Monkey Image"}
                      src={`${baseUrl}/images/${championUpdatedData.files.image}`}
                      layout="fill"
                      objectFit="cover"
                      className="w-full h-full  grayscale contrast-100 brightness-50  rounded-full border-2"
                    />
                  </div>
                  <MiniStatistics
                    tobiasCoins={championUpdatedData.tobiasCoins}
                    xp={championUpdatedData.xp}
                    level={championUpdatedData.level}
                    daystreak={championUpdatedData.daystreak}
                    daystreakShield={championUpdatedData.daystreakShield}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  );
};

export default UserBiography;
