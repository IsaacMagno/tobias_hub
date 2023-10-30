import React, { useState, useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import {
//   setChampions,
//   selectChampion,
// } from "../../Redux/reducers/championsSlice";
// import { setUser } from "../../Redux/reducers/userSlice";
// import {
//   addEvent,
//   removeEvent,
//   getStats,
//   updateDaystreak,
// } from "../../services/axiosRequests";

import FullCalendar from "@fullcalendar/react";
import daydgridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import bootstrap5Plugin from "@fullcalendar/bootstrap5";

const Calendar = ({ show }) => {
  const [color, selectColor] = useState("green");
  const [events, setEvents] = useState();

  // const navigate = useNavigate();
  // const dispatch = useDispatch();

  // const { selectedChampion } = useSelector((state) => state.champions);
  // const { user, logged } = useSelector((state) => state.user);

  // useEffect(() => {
  //   if (!logged) return navigate("/");

  //   const {
  //     calendars: { events },
  //   } = selectedChampion;

  //   const filteredEvents = events.map((ev) => {
  //     const eventObj = {
  //       title: ev.title,
  //       date: ev.date,
  //       display: ev.display,
  //       backgroundColor: ev.backgroundColor,
  //     };

  //     return eventObj;
  //   });

  //   setEvents(filteredEvents);
  // }, [selectedChampion]);

  // const handleDateClick = async (dateClickInfo) => {
  //   const { id } = user;

  //   const calendarApi = dateClickInfo.view.calendar;

  //   const allEvents = calendarApi.getEvents();

  //   const eventExists = allEvents.filter(
  //     (day) => day.startStr === dateClickInfo.dateStr
  //   );

  //   if (eventExists.length) {
  //     eventExists[0].remove();
  //     var date = {
  //       date: dateClickInfo.dateStr,
  //     };
  //     await removeEvent(date, id);
  //   } else {
  //     var newEvent = {
  //       title: "",
  //       date: dateClickInfo.dateStr,
  //       display: "background",
  //       backgroundColor: color,
  //     };
  //     calendarApi.addEvent(newEvent);
  //     await addEvent(newEvent, id);
  //     await updateDaystreak(id);
  //   }

  //   const updatedChampionStats = await getStats(id).then(
  //     (championUpdated) => championUpdated
  //   );

  //   dispatch(setUser(updatedChampionStats));
  //   dispatch(selectChampion(updatedChampionStats));
  // };

  return show ? (
    <div className="flex flex-col justify-center p-2 ">
      <div className="m-auto ">
        <button
          type="button"
          className="btn-calendar bg-green-600 hover:bg-green-500"
          onClick={() => selectColor("green")}
        />
        <button
          type="button"
          className="btn-calendar bg-yellow-400 hover:bg-yellow-200"
          onClick={() => selectColor("yellow")}
        />
        <button
          type="button"
          className="btn-calendar bg-red-600 hover:bg-red-500"
          onClick={() => selectColor("red")}
        />
      </div>
      <div className="my-1 ">
        <FullCalendar
          plugins={[daydgridPlugin, interactionPlugin, bootstrap5Plugin]}
          locale="pt-br"
          // dateClick={handleDateClick}
          height={"31rem"}
          events={events}
        />
      </div>
    </div>
  ) : null;
};

export default Calendar;
