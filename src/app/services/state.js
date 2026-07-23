"use client";
import React, { createContext, useContext, useState } from "react";

const GlobalContext = createContext([{}, () => {}]);

export function GlobalProvider({ children }) {
  const [globalState, setGlobalState] = useState({
    champion: null,
    championSelected: null,
    championActivities: null,
  });

  return (
    <GlobalContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalState() {
  return useContext(GlobalContext);
}
