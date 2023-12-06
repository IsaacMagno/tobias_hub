"use client";
import { ProgressBar } from "react-loader-spinner";
import { phrasesArray } from "/public/data/phrases";

export const Loader = ({
  textColor,
  opacity,
  textSize,
  barWidth,
  barHeight,
  minHeight,
}) => {
  const randomIndex = Math.floor(Math.random() * phrasesArray.length);
  const randomPhrase = phrasesArray[randomIndex];

  return (
    <div
      className={`${
        minHeight ? "min-h-screen" : ""
      } flex flex-col justify-center items-center`}
    >
      <h1
        className={`${textSize} ${opacity} ${textColor} text-center font-bold`}
      >
        {randomPhrase}
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
