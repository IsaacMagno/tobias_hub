export const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const doLogin = async (username, password) => {
  try {
    const response = await fetch(`${baseUrl}/champion-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    const { token, isValid, champion } = data.validLogin;

    if (isValid) {
      return { champion, token };
    } else {
      return isValid;
    }
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
    return { isValid: false };
  }
};

export const getQuote = async () => {
  try {
    const response = await fetch(`${baseUrl}/random-quote`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const quote = await response.json();
    return quote;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
};

export const createQuote = async (token, quoteData) => {
  try {
    const response = await fetch(`${baseUrl}/shield/quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        quoteData,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const getCalendarById = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/calendars/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const calendar = await response.json();
    return calendar;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
};

export const getChampionsImages = async () => {
  try {
    const response = await fetch(`${baseUrl}/uploads`, { method: "GET" });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const championsImages = await response.json();

    return championsImages;
  } catch (error) {
    console.log("There has been a problem with your fetch operation:", error);
  }
};

export const getChampionDataById = async (id, token) => {
  try {
    const response = await fetch(`${baseUrl}/champion/${id}`, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { champion } = await response.json();

    return champion;
  } catch (error) {
    console.error(error);
  }
};

export const updateActivitie = async (activitieData) => {
  try {
    const {
      championId,
      selectedActivitie,
      activitieIntensity,
      activitieValue,
      token,
    } = activitieData;

    const response = await fetch(`${baseUrl}/shield/activities/${championId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        [selectedActivitie]: activitieValue,
        activitieIntensity,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const addEvent = async (token, event, id) => {
  try {
    const response = await fetch(`${baseUrl}/shield/event/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        event,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const removeEvent = async (token, eventDate, id) => {
  try {
    const response = await fetch(`${baseUrl}/shield/event/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        eventDate,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const createGoal = async (token, goalData) => {
  try {
    const response = await fetch(`${baseUrl}/goal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        goalData,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const updateGoal = async (token, goalData, id) => {
  try {
    const response = await fetch(`${baseUrl}/goal/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({
        goalData,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const deleteGoal = async (token, id) => {
  try {
    const response = await fetch(`${baseUrl}/goal/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const getAchievements = async () => {
  try {
    const response = await fetch(`${baseUrl}/achievements`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const buyItem = async (buyData) => {
  try {
    const response = await fetch(`${baseUrl}/shield/buyItem`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: buyData.token,
      },
      body: JSON.stringify({
        buyData,
      }),
    });

    if (!response.ok) {
      console.error("Network response was not ok");
      return false;
    } else {
      return true;
      // return await response.json();
    }
  } catch (error) {
    console.error(error);
  }
};

export const updateChampionBio = async (id, bio, token) => {
  try {
    const response = await fetch(`${baseUrl}/shield/champion/bio/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({
        bio,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const updateDaystreak = async (id, token) => {
  try {
    const response = await fetch(`${baseUrl}/shield/champion/daystreak/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const regenerateDailyQuest = async (updateData) => {
  try {
    const response = await fetch(`${baseUrl}/regenerate-quest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        updateData,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

export const getAllChampionsMonthlyChallenge = async () => {
  try {
    const response = await fetch(`${baseUrl}/getallchampionsmonthlychallenge`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const championsMonthlyChallenge = await response.json();
    return championsMonthlyChallenge;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
};

export const getStatsDetailsById = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/statsDetails/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const championStatsDetails = await response.json();
    return championStatsDetails;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
};

export const getEventCountByDate = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/countEvents/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const eventCount = await response.json();
    return eventCount;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
};

export const getDailyActivitieById = async (id) => {
  try {
    const response = await fetch(`${baseUrl}/dailyActivities/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const dailyActivities = await response.json();
    return dailyActivities;
  } catch (error) {
    console.error("There has been a problem with your fetch operation:", error);
  }
};
