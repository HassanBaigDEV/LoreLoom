import React from "react";
import Header from "@/components/common/header";
import AccountSettings from "@/components/USettings/aSettings";
import BillingSection from "@/components/USettings/billing";
import Footer from "@/components/common/footer";
import HelpButton from "@/components/common/help";

const Page = () => {
  return (
    <>
      <div className="bg-gray-100 App">
        <Header />
        <main className="pt-32">
          <AccountSettings />
          <BillingSection />
        </main>
        <Footer />
        <HelpButton />
      </div>
    </>
  );
};

export default Page;
