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

  useEffect(() => {
    const getCalendar = async () => {
      const { calendars } = await getCalendarById(championId);
      setCalendar(calendars);

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

  const handleDateClick = async (dateClickInfo) => {
    const { id } = calendar;

    const calendarApi = dateClickInfo.view.calendar;

    const allEvents = calendarApi.getEvents();

    const eventExists = allEvents.filter(
      (day) => day.startStr === dateClickInfo.dateStr
    );

    if (eventExists.length) {
      eventExists[0].remove();
      var date = {
        date: dateClickInfo.dateStr,
      };
      await removeEvent(token, date, id);
    } else {
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
    </div>
  );
};

export default Calendar;
