import type { Metadata } from "next";
import TaxReceiptClient from "./TaxReceiptClient";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Your Tax Receipt · The Harris County Project",
  description:
    "Enter your home value and see your property tax bill split line by line across Harris County, flood control, Harris Health, the Port, HISD, and the City of Houston, at the adopted 2025 rates.",
  openGraph: {
    title: "Your Tax Receipt — where your property tax dollar actually goes",
    description: "Home value in, line-item civic receipt out. Adopted 2025 rates.",
    images: [`${SITE_URL}/api/og?s=${encodeURIComponent("Tax receipt|Line by line")}&badge=${encodeURIComponent("YOUR TAX RECEIPT")}`],
  },
};

export default function TaxReceiptPage() {
  return <TaxReceiptClient />;
}
