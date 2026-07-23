import { createAdminClient } from "@/lib/supabase/admin";

function calculateGoals(goal, type) {
  const typeLower = type.toLowerCase();
  if (typeLower === "anual") {
    return {
      month: (goal / 12).toFixed(2),
      week: (goal / 52.1429).toFixed(2),
      daily: (goal / 365.25).toFixed(2),
    };
  }
  if (typeLower === "mensal") {
    return {
      month: goal,
      week: (goal / 4.34524).toFixed(2),
      daily: (goal / 30.4167).toFixed(2),
    };
  }
  return { month: 0, week: 0, daily: 0 };
}

export async function createGoal(goalData) {
  const supabase = createAdminClient();
  const { goal, type } = goalData;
  const { month, week, daily } = calculateGoals(goal, type);

  const { data, error } = await supabase
    .from("goals")
    .insert({
      ...goalData,
      month: parseFloat(month),
      week: parseFloat(week),
      daily: parseFloat(daily),
      actual: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id, goalData) {
  const supabase = createAdminClient();
  const { data: goal } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .single();

  const actual = goal.actual + parseInt(goalData, 10);
  const patch = { actual };

  if (actual >= goal.goal) {
    patch.completed = true;
    patch.completedDate = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await supabase
    .from("goals")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGoal(id) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("goals").delete().eq("id", id);
  if (error) throw error;
}

export async function updateGoalByLink(championId, stats, value) {
  const supabase = createAdminClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("champion_id", championId)
    .eq("link", stats);

  for (const goal of goals || []) {
    await updateGoal(goal.id, value);
  }
}
