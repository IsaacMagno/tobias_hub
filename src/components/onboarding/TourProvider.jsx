"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  TOURS,
  clearAllTours,
  clearTour,
  emitTourProgress,
  isPageTourDone,
  isTourDone,
  isTourUnlocked,
  markTourDone,
  readProgress,
  reopenPageTour,
  REOPEN_TOUR_EVENT,
  skipAllTours,
  TOUR_PROGRESS_EVENT,
  toursForPath,
} from "@/lib/onboarding/tours";
import PageTourCard from "@/components/onboarding/PageTourCard";

const TourContext = createContext(null);

export function useTour() {
  return useContext(TourContext);
}

export { reopenPageTour };

/**
 * @param {{ hasMission?: boolean, children: import('react').ReactNode }} props
 */
export default function TourProvider({ hasMission = null, children }) {
  const { data: session } = useSession();
  const championId = session?.user?.champion_id;
  const pathname = usePathname();
  const [tick, setTick] = useState(0);
  const [forceTourId, setForceTourId] = useState(null);
  const [missionHint, setMissionHint] = useState(hasMission);

  useEffect(() => {
    if (hasMission != null) setMissionHint(hasMission);
  }, [hasMission]);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener(TOUR_PROGRESS_EVENT, bump);
    return () => window.removeEventListener(TOUR_PROGRESS_EVENT, bump);
  }, []);

  useEffect(() => {
    setForceTourId(null);
  }, [pathname]);

  useEffect(() => {
    const onReopen = () => {
      if (!championId) return;
      const candidates = toursForPath(pathname);
      const pick =
        candidates.find((t) => {
          if (t.skipIfMission) {
            if (missionHint == null) return false;
            if (missionHint) return false;
          }
          if (t.needsMission && missionHint !== true) return false;
          return true;
        }) ||
        (pathname === "/" && missionHint == null ? null : candidates[0]);
      if (!pick) return;
      clearTour(championId, pick.id);
      emitTourProgress();
      setForceTourId(pick.id);
      setTick((n) => n + 1);
    };
    window.addEventListener(REOPEN_TOUR_EVENT, onReopen);
    return () => window.removeEventListener(REOPEN_TOUR_EVENT, onReopen);
  }, [championId, pathname, missionHint]);

  const progress = useMemo(() => {
    void tick;
    return championId
      ? readProgress(championId)
      : { completed: [], skippedAll: false };
  }, [championId, tick]);

  const activeTour = useMemo(() => {
    void tick;
    if (!championId || progress.skippedAll) return null;

    if (forceTourId && TOURS[forceTourId]) {
      const forced = TOURS[forceTourId];
      if (forced.match(pathname)) return forced;
    }

    const candidates = toursForPath(pathname);
    for (const tour of candidates) {
      if (tour.skipIfMission) {
        if (missionHint == null) continue;
        if (missionHint) continue;
      }
      if (tour.needsMission && missionHint !== true) continue;
      if (!isTourUnlocked(championId, tour.id)) continue;
      if (isTourDone(championId, tour.id)) continue;
      return tour;
    }
    return null;
  }, [championId, pathname, progress, forceTourId, missionHint, tick]);

  const completeTour = useCallback(
    (tourId) => {
      if (!championId) return;
      markTourDone(championId, tourId);
      setForceTourId(null);
      emitTourProgress();
      setTick((n) => n + 1);
    },
    [championId]
  );

  const skipEverything = useCallback(() => {
    if (!championId) return;
    skipAllTours(championId);
    setForceTourId(null);
    emitTourProgress();
    setTick((n) => n + 1);
  }, [championId]);

  const resetAll = useCallback(() => {
    if (!championId) return;
    clearAllTours(championId);
    setForceTourId(null);
    emitTourProgress();
    setTick((n) => n + 1);
  }, [championId]);

  const pageTourDone = useMemo(() => {
    void tick;
    if (!championId) return true;
    return isPageTourDone(championId, pathname, missionHint);
  }, [championId, pathname, missionHint, tick]);

  const value = useMemo(
    () => ({
      championId,
      progress,
      activeTour,
      missionHint,
      pageTourDone,
      completeTour,
      skipEverything,
      resetAll,
      setMissionHint,
      reopenPageTour,
    }),
    [
      championId,
      progress,
      activeTour,
      missionHint,
      pageTourDone,
      completeTour,
      skipEverything,
      resetAll,
    ]
  );

  return (
    <TourContext.Provider value={value}>
      {children}
      {activeTour ? (
        <PageTourCard
          key={activeTour.id}
          tour={activeTour}
          onComplete={() => completeTour(activeTour.id)}
          onSkipAll={skipEverything}
        />
      ) : null}
    </TourContext.Provider>
  );
}
