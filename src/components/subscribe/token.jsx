import React from "react";
import Paypal from "@/assets/images/pay.svg";
import token from "@/assets/images/token.webp";
import Image from "next/image";

export default function TokenCard({ tokens, price }) {
  return (
    <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg">
      <Image src={token} alt="Token icon" className="w-2/4 pr-2" />
      <p className="text-2xl font-bold text-gray-700">{tokens} Tokens</p>
      <p className="mt-2 text-xl text-gray-700">${price}</p>
      <button className="flex items-center justify-center px-4 py-2 mt-4 text-gray-800 bg-yellow-500 rounded-full">
        <Paypal className="w-4/5 mb-4 mr-2" />
        Checkout
      </button>
      <p className="mt-2 text-sm text-gray-800">1 Token per extra Story</p>
    </div>
  );
}
