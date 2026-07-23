"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import MiniStatistics from "./LayoutComponents/MiniStatistics";
import { getQuote, updateChampionBio } from "../../services/requests";
import { getChampionAvatarSrc } from "../../services/constants";
import { useGlobalState } from "../../services/state";
import { Pencil, SendHorizontal } from "lucide-react";
import { useSession } from "next-auth/react";
import { useHandleUpdateChampionData } from "../../hooks/useHandleUpdateChampionData";

const QuoteSkeleton = () => (
  <div className="flex flex-col gap-2 animate-pulse" aria-hidden="true">
    <div className="h-4 bg-zinc-800 rounded w-full max-w-md" />
    <div className="h-4 bg-zinc-800 rounded w-4/5 max-w-sm" />
    <div className="h-3 bg-zinc-900 rounded w-24 mt-1" />
  </div>
);

const UserBiography = ({ displayBio, userData, initialQuote }) => {
  const [championUpdatedData, setChampionUpdatedData] = useState();

  const handleUpdateChampionData = useHandleUpdateChampionData();

  const [editBioMode, setEditBioMode] = useState(false);
  const [editBioText, setEditBioText] = useState("");
  const [quotes, setQuotes] = useState(initialQuote);
  const quoteFetchedRef = useRef(false);
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

    setChampionUpdatedData(userData);

    return () => window.removeEventListener("resize", handleResize);
  }, [userData]);

  useEffect(() => {
    if (initialQuote) {
      setQuotes(initialQuote);
    }
  }, [initialQuote]);

  useEffect(() => {
    if (displayBio || initialQuote || quoteFetchedRef.current) return;

    quoteFetchedRef.current = true;
    let cancelled = false;

    const fetchQuote = async () => {
      try {
        const result = await getQuote();
        if (!cancelled && result?.quote) setQuotes(result.quote);
      } catch {
        if (!cancelled) {
          setQuotes({ quote: "Keep Going", author: "Tobias" });
        }
      }
    };

    fetchQuote();

    return () => {
      cancelled = true;
    };
  }, [displayBio, initialQuote]);

  const handleEditMode = async () => {
    if (editBioMode) {
      await updateChampionBio(championUpdatedData.id, editBioText);
      const championUpdated = await handleUpdateChampionData(
        championUpdatedData.id
      );
      setChampionUpdatedData(championUpdated);
    }

    setEditBioMode(!editBioMode);
  };

  const avatarSrc = championUpdatedData
    ? getChampionAvatarSrc(championUpdatedData)
    : null;

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
                  alt={"Avatar do campeão"}
                  src={avatarSrc}
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
                    {(championUpdatedData.biography ?? "")
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
                  <QuoteSkeleton />
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
                  alt={"Avatar do campeão"}
                  src={avatarSrc}
                  fill
                  className="object-cover w-full h-full grayscale contrast-100 brightness-50 rounded-full border-2"
                />
              </div>
            ) : (
              <div className="">
                <div className="flex flex-col gap-2 items-center ">
                  <div className="relative w-44 h-44">
                    <Image
                      alt={"Avatar do campeão"}
                      src={avatarSrc}
                      fill
                      className="object-cover w-full h-full grayscale contrast-100 brightness-50 rounded-full border-2"
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
