import React from "react";
import Image from "next/image";
import logo from "@/assets/images/logo.png";

export default function Logo() {
  return <Image src={logo} alt="Logo" className="w-48 mb-6" />;
}
