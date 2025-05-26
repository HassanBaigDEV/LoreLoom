"use client";
import React, { Suspense, useEffect, useState } from "react";
import SubscriptionSuccess from "@/components/subscription/success";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <div>Loading...</div>
        </div>
      }
    >
      <SubscriptionSuccess />
    </Suspense>
  );
}
