"use client";
import { useEffect, useState } from "react";
import { ProgressBar } from "react-loader-spinner";
import { phrasesArray } from "/public/data/phrases";

const DEFAULT_PHRASE = phrasesArray[0];

export const Loader = ({
  textColor,
  opacity,
  textSize,
  barWidth,
  barHeight,
  minHeight,
}) => {
  const [phrase, setPhrase] = useState(DEFAULT_PHRASE);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * phrasesArray.length);
    setPhrase(phrasesArray[randomIndex]);
  }, []);

  return (
    <div
      className={`${
        minHeight ? "min-h-screen" : ""
      } flex flex-col justify-center items-center`}
    >
      <h1
        className={`${textSize} ${opacity} ${textColor} text-center font-bold`}
      >
        {phrase}
      </h1>
      <ProgressBar
        height={barHeight}
        width={barWidth}
        ariaLabel="progress-bar-loading"
        wrapperStyle={{}}
        wrapperClass="progress-bar-wrapper"
        borderColor="#000000"
        barColor="#ffffff"
      />
    </div>
  );
};
