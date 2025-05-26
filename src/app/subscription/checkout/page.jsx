"use client";
import React, { useState, useEffect } from "react";
import CheckoutMain from "@/components/subscription/checkout";

export default function CheckoutPage() {
  return
  <Suspense fallback={<div>Loading checkout…</div>}>
    <CheckoutMain />
  </Suspense>;
}
