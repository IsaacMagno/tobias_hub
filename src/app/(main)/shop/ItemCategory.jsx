import React from "react";
import Image from "next/image";

const shopIcons = {
  armor: "/shopIcons/armor.svg",
  boots: "/shopIcons/boots.svg",
  cape: "/shopIcons/cape.svg",
  helmet: "/shopIcons/helmet.svg",
  shield: "/shopIcons/shield.svg",
  sword: "/shopIcons/sword.svg",
};

const ItemCategory = () => {
  const itemsCategory = [
    shopIcons.helmet,
    shopIcons.armor,
    shopIcons.boots,
    shopIcons.sword,
    shopIcons.shield,
    shopIcons.cape,
  ];

  return (
    <div className="grid grid-cols-6 lg:grid-cols-3 gap-2">
      {itemsCategory.map((category) => (
        <span className="bg-zinc-500 rounded cursor-pointer flex items-center justify-center p-2 hover:bg-zinc-600">
          <Image src={category} alt="item category" width={60} height={60} />
        </span>
      ))}
    </div>
  );
};

export default ItemCategory;
