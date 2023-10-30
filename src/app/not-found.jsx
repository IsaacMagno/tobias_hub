import React from "react";
import image404 from "/public/404_2.webp";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-black">
      <Image src={image404} alt="Not found" className="w-96" />
      {/* <h1 className="text-xl lg:text-3xl font-bold">Página não encontrada</h1> */}
      <Link
        href="/"
        className=" p-2 lg:p-3 rounded font-bold mt-12 hover:opacity-70 "
      >
        Voltar
      </Link>
    </div>
  );
};

export default NotFound;
