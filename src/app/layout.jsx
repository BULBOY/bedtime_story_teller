// app/layout.jsx
import React from "react";
import Header from "./components/header";
import Footer from "./components/footer";
import "./styles/global.css";
import { Poppins } from "next/font/google";
import NextAuthProvider from "./contexts/SessionProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: "Bedtime Story Teller",
  description: "A modern way of telling bedtime stories",
  keywords: ["nextjs", "react", "web development"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        <NextAuthProvider>
          <div className="layouts">
            <Header />
            <main className="main-content">{children}</main>
            <Footer />
          </div>
        </NextAuthProvider>
      </body>
    </html>
  );
}