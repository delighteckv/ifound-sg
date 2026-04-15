"use client";

import { configureAmplify } from "@/lib/amplify";

configureAmplify();

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
