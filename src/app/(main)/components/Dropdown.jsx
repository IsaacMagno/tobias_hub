import React from "react";
import { ChevronDown } from "lucide-react";

const Dropdown = ({ handleChange, optionsText, placeholder, show }) => {
  var disable = optionsText.length ? false : true;

  //  ml-[7.20rem] lg:mr-[8.4rem]

  return (
    <>
      <div className="absolute  bg-zinc-800 border-2 border-black w-7 h-7 lg:w-10 lg:h-10 flex items-center justify-center rounded-full appearance-none outline-none hover:cursor-pointer">
        <ChevronDown className=" text-zinc-950 " />
      </div>
      <input
        className="w-[10rem] lg:w-[12rem] ml-2 rounded-full py-0.5 lg:py-1 font-extrabold text-center text-sm md:text-base  appearance-none outline-none border-2 border-zinc-950 cursor-pointer "
        placeholder={placeholder}
        readOnly
        disabled={disable}
      />
      {show ? (
        <div className="min-w-[9rem] h-30 absolute bg-zinc-800 rounded-lg flex flex-col text-center gap-1 font-extrabold  border-zinc-950 z-20 ml-4 lg:ml-8 ">
          {optionsText.map((option) => (
            <span
              className="hover:bg-zinc-700 hover:cursor-pointer hover:rounded-t-lg"
              onClick={() => handleChange(option)}
            >
              {option}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
};

export default Dropdown;
