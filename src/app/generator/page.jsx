import React from "react";
import Header from "@/components/common/header";
import Footer from "@/components/common/footer";
import CreateStory from "@/components/generation/create";

export default function generation() {
  return (
    <>
      <div>
        <Header />
        <CreateStory />
      </div>
      <Footer />
    </>
  );
}
