import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import React, { useEffect, useState } from "react";
import { useGlobalState } from "../../services/state";
import { useHandleUpdateChampionData } from "../../hooks/useHandleUpdateChampionData";
import Image from "next/image";

import { buyItem } from "../../services/requests";

import tobiasCoin from "/public/userstreak/tobiasCoin.svg";
import { ShoppingCart } from "lucide-react";

const ItemCard = (item) => {
  const [showMore, setShowMore] = useState(false);
  const [characteristicsList, setCharacteristicsList] = useState([]);
  const [requirementsList, setRequirementsList] = useState([]);

  const handleUpdateChampionData = useHandleUpdateChampionData();
  const { data: session } = useSession();

  const {
    globalState: { champion },
  } = useGlobalState();

  useEffect(() => {
    const extractCharacteristics = () => {
      const list = Object.entries(item.characteristics)
        .filter(([key, value]) => value > 0)
        .map(([key, value]) => ({ [key]: value }));

      setCharacteristicsList(list);
    };

    const extractRequirements = () => {
      const list = Object.entries(item.requirements)
        .filter(([key, value]) => value > 0)
        .map(([key, value]) => ({ [key]: value }));

      setRequirementsList(list);
    };

    extractCharacteristics();
    extractRequirements();
  }, []);

  const handleBuyItem = () => {
    toast((t) => (
      <div className="flex justify-center items-center gap-3">
        <p>Comprar item?</p>
        <button
          className="bg-green-700 p-3 rounded text-white font-bold"
          onClick={() => confirmBuy(t.id, item.id)}
        >
          Confirmar
        </button>
      </div>
    ));
  };

  const confirmBuy = async (toastId, itemId) => {
    const token = session.accessToken;
    const { id } = champion;

    buyItem({ token, itemId, id })
      .then(() => {
        toast.success("Item comprado com sucesso!", { duration: 1000 });
        toast.dismiss(toastId);
      })
      .then(() => {
        handleUpdateChampionData(id, token);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Houve um erro ao comprar o item.", { duration: 1000 });
        toast.dismiss(toastId);
      });
  };

  return (
    <div className="flex flex-col max-w-xs w-80">
      <div
        // className="grid grid-cols-4 bg-zinc-900 p-2 rounded-lg gap-2 items-center"
        className="flex flex-col bg-zinc-900 items-center gap-4 rounded-t-lg cursor-pointer"
        onClick={() => setShowMore(!showMore)}
      >
        <div className="flex flex-col items-center gap-3 justify-center">
          <Image
            src={`/${item.image}`}
            alt="item image"
            width={100}
            height={100}
          />
          <span className="font-bold text-xs lg:text-sm lg:font-extrabold pl-4">
            {item.name}
          </span>
        </div>
        {/* <div className="flex flex-col">
          <span className="font-bold text-xs lg:text-sm lg:font-extrabold">
            {item.category}
          </span>
        </div> */}
        <div className="flex gap-2 items-center pb-2">
          <Image alt="tobiasCoin" src={tobiasCoin} className="w-4 lg:w-7" />

          <span className="font-bold text-xs lg:text-sm lg:font-extrabold">
            {item.price}
          </span>
        </div>
      </div>

      {showMore ? (
        <div className="flex flex-col bg-zinc-700 ">
          <div className="flex flex-col p-5 col-span-2 ">
            <p className="font-extrabold py-2 text-sm lg:text-base">
              Descrição
            </p>
            <p className="text-xs lg:text-sm">{item.description}</p>
          </div>
          {characteristicsList.length ? (
            <div className="flex flex-col pl-4 lg:pl-0">
              <p className="font-extrabold py-2 text-sm lg:text-base">
                Características
              </p>
              {Object.entries(item.characteristics).map(([key, value]) => {
                if (value > 0) {
                  return (
                    <p
                      className="font-bold text-xs lg:text-sm"
                      key={key}
                    >{`${key}: ${value}`}</p>
                  );
                }
                return null;
              })}
            </div>
          ) : null}
          {requirementsList.length ? (
            <div className="flex flex-col">
              <p className="font-extrabold py-2 text-sm lg:text-base">
                Requisitos
              </p>
              {Object.entries(item.requirements).map(([key, value]) => {
                if (value > 0) {
                  return (
                    <p
                      className="font-bold text-xs lg:text-sm"
                      key={key}
                    >{`${key}: ${value}`}</p>
                  );
                }
                return null;
              })}
            </div>
          ) : null}
        </div>
      ) : null}
      <button
        className="flex grow bg-red-900 p-2 justify-center items-center rounded-b-lg hover:bg-red-700"
        onClick={handleBuyItem}
      >
        <ShoppingCart />
      </button>
    </div>
  );
};

export default ItemCard;
