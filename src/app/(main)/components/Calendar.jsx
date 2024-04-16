"use client";
import React, { useState, useEffect } from "react";

import {
  addEvent,
  getCalendarById,
  removeEvent,
} from "../../services/requests";

import FullCalendar from "@fullcalendar/react";
import daydgridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

const Calendar = ({ show, token, championId }) => {
  const [color, selectColor] = useState("green");
  const [selectedColor, setSelectedColor] = useState("green");
  const [events, setEvents] = useState();
  const [calendar, setCalendar] = useState();
  const [greenDay, setGreenDay] = useState(0);
  const [yellowDay, setYellowDay] = useState(0);
  const [redDay, setRedDay] = useState(0);

  useEffect(() => {
    const getCalendar = async () => {
      const { calendars } = await getCalendarById(championId);
      setCalendar(calendars);
      setGreenDay(calendars.green_day);
      setYellowDay(calendars.yellow_day);
      setRedDay(calendars.red_day);

      const filteredEvents = calendars.events.map((ev) => {
        const eventObj = {
          title: ev.title,
          date: ev.date,
          display: ev.display,
          backgroundColor: ev.backgroundColor,
        };

        return eventObj;
      });
      setEvents(filteredEvents);
    };

    getCalendar();
  }, []);

  useEffect(() => {}, [greenDay, yellowDay, redDay]);

  const handleDateClick = async (dateClickInfo) => {
    const { id } = calendar;

    const calendarApi = dateClickInfo.view.calendar;

    const allEvents = calendarApi.getEvents();

    const eventExists = allEvents.filter(
      (day) => day.startStr === dateClickInfo.dateStr
    );

    if (eventExists.length) {
      switch (eventExists[0].backgroundColor) {
        case "green":
          setGreenDay(greenDay - 1);
          break;

        case "yellow":
          setYellowDay(yellowDay - 1);
          break;

        case "red":
          setRedDay(redDay - 1);
          break;
      }

      eventExists[0].remove();
      var date = {
        date: dateClickInfo.dateStr,
      };
      await removeEvent(token, date, id);
    } else {
      switch (color) {
        case "green":
          setGreenDay(greenDay + 1);
          break;

        case "yellow":
          setYellowDay(yellowDay + 1);
          break;

        case "red":
          setRedDay(redDay + 1);
          break;
      }

      var newEvent = {
        title: "",
        date: dateClickInfo.dateStr,
        display: "background",
        backgroundColor: color,
      };
      calendarApi.addEvent(newEvent);
      await addEvent(token, newEvent, id);
      // await updateDaystreak(id);
    }

    // const updatedChampionStats = await getStats(id).then(
    //   (championUpdated) => championUpdated
    // );

    // dispatch(setUser(updatedChampionStats));
    // dispatch(selectChampion(updatedChampionStats));
  };

  return (
    <div className="flex flex-col justify-center p-2 ">
      <div className="m-auto">
        <button
          type="button"
          className={`btn-calendar bg-green-600  ${
            selectedColor === "green" ? "bg-opacity-60" : "hover:bg-green-500"
          }`}
          onClick={() => {
            selectColor("green");
            setSelectedColor("green");
          }}
        />
        <button
          type="button"
          className={`btn-calendar bg-yellow-400  ${
            selectedColor === "yellow" ? "bg-opacity-60" : "hover:bg-yellow-200"
          }`}
          onClick={() => {
            selectColor("yellow");
            setSelectedColor("yellow");
          }}
        />
        <button
          type="button"
          className={`btn-calendar bg-red-600  ${
            selectedColor === "red" ? "bg-opacity-60" : "hover:bg-red-500"
          }`}
          onClick={() => {
            selectColor("red");
            setSelectedColor("red");
          }}
        />
      </div>

      <div className="my-1 ">
        {show && (
          <FullCalendar
            plugins={[daydgridPlugin, interactionPlugin, bootstrap5Plugin]}
            locale="pt-br"
            dateClick={handleDateClick}
            height={"31rem"}
            events={events}
          />
        )}
      </div>
      <div className="mx-auto flex gap-2">
        <span className="flex text-xs items-center">
          <button className="stats-calendar cursor-default bg-green-500" />
          <p>{greenDay}</p>
        </span>
        <span className="flex text-xs items-center">
          <button className="stats-calendar cursor-default bg-yellow-500" />
          <p>{yellowDay}</p>{" "}
        </span>
        <span className="flex text-xs items-center">
          <button className="stats-calendar cursor-default bg-red-500" />
          <p>{redDay}</p>{" "}
        </span>
      </div>
    </div>
  );
};

export default Calendar;
