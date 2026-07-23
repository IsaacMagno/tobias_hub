import { createAdminClient } from "@/lib/supabase/admin";

function mapEventToRow(event, calendarId) {
  return {
    title: event.title ?? "",
    date: event.date,
    display: event.display ?? "background",
    background_color: event.backgroundColor ?? event.background_color,
    calendar_id: parseInt(calendarId, 10),
  };
}

function mapEventFromRow(event) {
  if (!event) return event;
  return {
    ...event,
    backgroundColor: event.background_color,
  };
}

export async function getCalendarByChampionId(championId) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("calendars")
    .select("*, events(*)")
    .eq("champion_id", championId)
    .maybeSingle();

  if (error) throw error;

  if (data?.events) {
    data.events = data.events.map(mapEventFromRow);
  }

  return data;
}

async function bumpDayCount(calendarId, color, delta) {
  const column =
    color === "green"
      ? "green_day"
      : color === "red"
        ? "red_day"
        : color === "yellow"
          ? "yellow_day"
          : null;

  if (!column) return;

  const supabase = createAdminClient();
  const { data: cal } = await supabase
    .from("calendars")
    .select(column)
    .eq("id", calendarId)
    .single();

  await supabase
    .from("calendars")
    .update({ [column]: Math.max(0, (cal[column] || 0) + delta) })
    .eq("id", calendarId);
}

export async function createEvent(calendarId, event) {
  const supabase = createAdminClient();
  const payload = mapEventToRow(event, calendarId);

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  await bumpDayCount(calendarId, payload.background_color, 1);
  return mapEventFromRow(data);
}

export async function deleteEvent(calendarId, eventDate) {
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("calendar_id", calendarId)
    .eq("date", eventDate)
    .maybeSingle();

  if (!event) return null;

  await bumpDayCount(calendarId, event.background_color, -1);
  await supabase.from("events").delete().eq("id", event.id);
  return mapEventFromRow(event);
}

export async function countEventDateByWeekDayAndColor(championId) {
  const calendar = await getCalendarByChampionId(championId);
  const events = calendar?.events || [];

  const coresPorDia = {
    "segunda-feira": { green: 0, yellow: 0, red: 0 },
    "terça-feira": { green: 0, yellow: 0, red: 0 },
    "quarta-feira": { green: 0, yellow: 0, red: 0 },
    "quinta-feira": { green: 0, yellow: 0, red: 0 },
    "sexta-feira": { green: 0, yellow: 0, red: 0 },
    sábado: { green: 0, yellow: 0, red: 0 },
    domingo: { green: 0, yellow: 0, red: 0 },
  };

  events.forEach((event) => {
    const data = new Date(event.date);
    const dia = data.toLocaleDateString("pt-BR", { weekday: "long" });
    const color = event.background_color;
    if (coresPorDia[dia] && color) coresPorDia[dia][color]++;
  });

  return coresPorDia;
}
