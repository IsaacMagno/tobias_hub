import Image from "next/image";
import Link from "next/link";
import React from "react";
import duolingo from "/public/toolsImages/duolingo.svg";
import strava from "/public/toolsImages/strava.webp";
import mimo from "/public/toolsImages/mimo.webp";
import chess from "/public/toolsImages/chess.webp";

const ToolLink = ({ href, title, imageSrc, altText, description }) => {
  return (
    <Link href={href} passHref target="_blank">
      <div className="flex flex-col justify-center items-center bg-zinc-600 hover:bg-zinc-500 rounded-lg p-5 gap-4 hover:shadow-lg transition-shadow cursor-pointer">
        <h1 className="text-center font-extrabold text-xl">{title}</h1>
        <div className="w-20 h-20 lg:w-32 lg:h-32 relative">
          <Image src={imageSrc} layout="fill" objectFit="cover" alt={altText} />
        </div>
        <p className="text-center text-sm">{description}</p>
      </div>
    </Link>
  );
};

const page = () => {
  return (
    <div className="grid lg:grid-cols-4 gap-4 pb-20 lg:pb-0">
      <ToolLink
        href="https://invite.duolingo.com/BDHTZTB5CWWKT5MOPHLS2RSXLE?v=if"
        title="Duolingo"
        imageSrc={duolingo}
        altText="Logo do Duolingo"
        description="Aprenda diversos idiomas gratuitamente!"
      />
      <ToolLink
        href="https://www.strava.com/mobile"
        title="Strava"
        imageSrc={strava}
        altText="Logo do Strava"
        description="Tenha dados e métricas de suas atividades físicas!"
      />
      <ToolLink
        href="https://getmimo.com/invite/tmlp0d"
        title="Mimo"
        imageSrc={mimo}
        altText="Logo do Mimo"
        description="Aprenda programação de forma divertida e gratuita!"
      />
      <ToolLink
        href="https://www.chess.com/club/tobias-hub/join/6e1169"
        title="Chess"
        imageSrc={chess}
        altText="Logo do CHess"
        description="Aprenda xadrez e desafie seus amigos!"
      />
    </div>
  );
};

export default page;
