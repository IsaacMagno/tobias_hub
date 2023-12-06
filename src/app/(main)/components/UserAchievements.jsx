import React from "react";
import achievTemp from "/public/achievementIcons/achievTemp.svg";
import Image from "next/image";

const UserAchievements = () => {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Conquistas</h1>
      <div className=" max-w-3xl ">
        <ul className="flex gap-2 flex-wrap justify-center sm:justify-normal">
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}

              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
          <li className="p-8 lg:p-14 bg-gray-300 rounded-lg">
            <span>
              {/* <p className="text-black">Imagem</p> */}
              <Image src={achievTemp} width={70} />
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UserAchievements;
