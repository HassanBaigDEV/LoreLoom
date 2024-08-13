// app/page.js
import React from "react";
import Header from "@/components/common/header";
import MainContent from "@/components/discover/main";
import Footer from "@/components/common/footer";
import HelpButton from "@/components/common/help";

function Page() {
  return (
    <div className="bg-gray-100 App">
      <Header />
      <MainContent />
      <Footer />
      <HelpButton />
    </div>
  );
}

export default Page;
