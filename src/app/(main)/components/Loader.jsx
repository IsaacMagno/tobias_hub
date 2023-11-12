"use client";
import { ProgressBar } from "react-loader-spinner";

export const Loader = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold opacity-60 text-center">
        Keep grinding
      </h1>
      <ProgressBar
        height="100"
        width="200"
        ariaLabel="progress-bar-loading"
        wrapperStyle={{}}
        wrapperClass="progress-bar-wrapper"
        borderColor="#000000"
        barColor="#ffffff"
      />
    </div>
  );
};
