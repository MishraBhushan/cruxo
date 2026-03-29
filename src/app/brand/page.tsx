import type { Metadata } from "next";
import { BrandLab } from "@/components/brand/BrandLab";

export const metadata: Metadata = {
  title: "Cruxo Brand Lab",
  description:
    "Measured wordmark studies, icon directions, and motion explorations for the Cruxo brand system.",
};

export default function BrandPage() {
  return <BrandLab />;
}
