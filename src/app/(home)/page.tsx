import type { Metadata } from "next";

import React from "react";
import ProductsCard from "@/components/ecommerce/ProductsCard";
import AuthFloatingButton from "@/components/auth/AuthFloatingButton";

export const metadata: Metadata = {
  title:
    "ELMES-Service",
  description: "Platform de gestion des travaux pratiques",
};

export default function Ecommerce() {
  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <ProductsCard />
        </div>
      </div>
      <AuthFloatingButton />
    </>
  );
}
