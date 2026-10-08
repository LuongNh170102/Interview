import localFont from "next/font/local";
import { Jost, Roboto } from "next/font/google";
const jostGoogle = Jost({
  subsets: ["latin"],
  variable: "--font-jost"
});
const robotoGoogle = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto"
});
const genralSans = localFont({
  src: [
    {
      path: "./../fonts/GeneralSans/GeneralSans-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "./../fonts/GeneralSans/GeneralSans-Semibold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-GeneralSans"
});
const kontrap = localFont({
  src: [
    {
      path: "./../fonts/KontrapunktMiki/KontrapunktMiki-Regular.ttf",
      weight: "400"
    },
    {
      path: "./../fonts/KontrapunktMiki/KontrapunktMiki-Regular.woff",
      weight: "400"
    },
    {
      path: "./../fonts/KontrapunktMiki/KontrapunktMiki-Regular.woff2",
      weight: "400"
    },
    {
      path: "./../fonts/KontrapunktMiki/KontrapunktMiki-Bold.ttf",
      weight: "700"
    },
    {
      path: "./../fonts/KontrapunktMiki/KontrapunktMiki-Bold.woff",
      weight: "700"
    },
    {
      path: "./../fonts/KontrapunktMiki/KontrapunktMiki-Bold.woff2",
      weight: "700"
    }
  ],
  variable: "--font-kontrap"
});
const beVietnamPro = localFont({
  src: [
    {
      path: "./../fonts/BeVietnamPro/BeVietnamPro-Regular.ttf",
      weight: "400",
      style: "normal"
    },
    {
      path: "./../fonts/BeVietnamPro/BeVietnamPro-Bold.ttf",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-beVietnamPro"
});
export { genralSans, kontrap, jostGoogle, robotoGoogle, beVietnamPro };
