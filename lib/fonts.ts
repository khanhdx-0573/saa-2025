import { Montserrat, Montserrat_Alternates } from "next/font/google";

export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
});

export const montserratAlternates = Montserrat_Alternates({
  variable: "--font-montserrat-alternates",
  weight: ["500", "700"],
  subsets: ["latin", "vietnamese"],
});
