import { getChampionDataById } from "../services/requests";
import { useGlobalState } from "../services/state";

export const useHandleUpdateChampionData = () => {
  const { globalState, setGlobalState } = useGlobalState();

  const handleUpdateChampionData = async (champion_id, accessToken) => {
    const champion = await getChampionDataById(champion_id, accessToken);

    setGlobalState({
      ...globalState,
      champion,
    });

    return champion;
  };

  return handleUpdateChampionData;
};
