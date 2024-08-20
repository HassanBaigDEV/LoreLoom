import React from "react";
import PlanCard from "@/components/subscribe/plan";
import TokenCard from "@/components/subscribe/token";
import Header from "@/components/common/header";

export default function SubscriptionPage() {
  const plans = [
    {
      title: "StoryBook Lite",
      price: "Free for a lifetime",
      features: ["3 story generations per day", "Discover user stories"],
      current: true,
    },
    {
      title: "StoryBook Plus",
      price: "$14/month billed yearly",
      features: [
        "Unlimited Story Generations",
        "6 Digital Comics",
        "5 Audio stories per month",
        "100 AI Images",
      ],
      current: false,
    },
    {
      title: "Storyteller",
      price: "$30/month billed yearly",
      features: [
        "Unlimited Stories",
        "Unlimited Digital Comics",
        "Unlimited Audio Stories",
        "Unlimited AI Images",
      ],
      current: false,
    },
  ];

  const tokens = [
    { tokens: 3, price: 5 },
    { tokens: 7, price: 10 },
    { tokens: 15, price: 20 },
  ];

  return (
    <>
      <Header />
      <main className="p-8 bg-white">
        <h1 className="mt-32 mb-4 text-3xl font-bold text-gray-800">
          Choose a plan
        </h1>
        <p className="mb-8 text-lg text-gray-800">Unleash your creativity</p>
        <hr className="mb-8" />
        <div className="grid grid-cols-3 gap-8 mt-4 mb-16">
          {plans.map((plan, index) => (
                      <PlanCard
                        key={index}
                        title={plan.title}
                        img={plan.img}
                        price={plan.price}
                        features={plan.features}
                        current={plan.current}
                      />          ))}
        </div>
        <h2 className="mb-4 text-2xl font-bold text-gray-800">Pay as you go</h2>
        <p className="mb-8 text-lg text-gray-800">
          Purchase tokens to use our awesome storytelling features. No
          commitment.
        </p>
        <hr className="mb-8" />
        <div className="grid grid-cols-3 gap-8 mt-4">
          {tokens.map((token, index) => (
            <TokenCard key={index} {...token} />
          ))}
        </div>
      </main>
    </>
  );
}
