import React from "react";
import Image from "next/image";
import cover from "@/assets/images/boyanddog.webp";

const BillingSection = () => {
  return (
    <div className="container p-6 mx-auto">
      <h2 className="mb-6 text-2xl font-bold text-gray-700">Billing</h2>
      <div className="p-6 rounded-lg shadow bg-gray-50">
        <h3 className="mb-4 text-xl font-semibold text-gray-700">
          Subscription Plan
        </h3>
        <p className="mb-6 text-gray-600">
          See billing information regarding your current plan
        </p>
        <div className="flex items-center p-4 bg-gray-100 rounded-lg shadow-inner">
          <Image
            className="object-cover w-32 h-24 mr-6 rounded-lg"
            src={cover}
            alt="Plan Image"
            width={100}
            height={100}
          />
          <div>
            <p className="text-lg font-bold text-gray-700">StoryWeaver Lite</p>
            <p className="text-sm text-gray-600">You are on the free plan</p>
            <a
              href="/upgrade"
              className="inline-block mt-2 font-semibold text-blue-500"
            >
              Upgrade Plan +
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
