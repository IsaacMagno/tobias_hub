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
    const { token, isValid, champUpdated } = data.validLogin;

    if (isValid) {
      return { champUpdated, token };
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
