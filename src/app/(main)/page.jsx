"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import UserBiography from "./components/UserBiography";
import UserStats from "./components/UserStats";
import Calendar from "./components/Calendar";

const Home = () => {
  const [bgColor, setBgColor] = useState("bg-green-500");
  const [renderCalendar, setRenderCalendar] = useState(false);

  const router = useRouter();

  const { data: session } = useSession();
  let user;

  try {
    user = session.token.token.user.champUpdated;
  } catch (error) {
    if (!user) return router.replace("/login");
  }

  useEffect(() => {
    setRenderCalendar(true);
  }, []);

  return (
    <div className="flex flex-col  md:gap-6 justify-center lg:pr-80 lg:min-h-screen lg:box-content">
      <div className="flex flex-col gap-3">
        <UserBiography displayBio={false} userData={user} />
        <div className="flex justify-center items-center gap-4 p-3">
          <div className="flex flex-col gap-2">
            <button
              className="bg-green-500 p-4 rounded-lg hover:opacity-70"
              onClick={() => setBgColor("bg-green-500")}
            ></button>
            <button
              className="bg-yellow-500 p-4 rounded-lg hover:opacity-70"
              onClick={() => setBgColor("bg-yellow-500")}
            ></button>
            <button
              className="bg-red-500 p-4 rounded-lg hover:opacity-70"
              onClick={() => setBgColor("bg-red-500")}
            ></button>
            <button
              className="bg-blue-500 p-4 rounded-lg hover:opacity-70"
              onClick={() => setBgColor("bg-blue-500")}
            ></button>
          </div>
          <div className={`flex ${bgColor} h-56 w-96 rounded-lg`}></div>
        </div>
        <div>
          <Calendar show={renderCalendar} calendar={user.calendars} />
        </div>
      </div>
      <UserStats statistics={user.statistics} activities={user.activities} />
    </div>
  );
};

export default Home;
