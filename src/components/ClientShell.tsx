"use client";

import dynamic from "next/dynamic";

const Preloader = dynamic(() => import("@/components/Preloader"), { ssr: false });
const CustomCursor = dynamic(() => import("@/components/CustomCursor"), { ssr: false });
const GlobalBackground = dynamic(() => import("@/components/GlobalBackground"), { ssr: false });

export default function ClientShell() {
  return (
    <>
      <Preloader />
      <CustomCursor />
      <GlobalBackground />
    </>
  );
}
