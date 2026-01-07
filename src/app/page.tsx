/**
 * MetaDJ Scope - Homepage
 * MVP: Redirects to Soundscape (the only active module)
 * Future: Multi-module landing page with Avatar Studio, etc.
 */

import { redirect } from "next/navigation";

export default function Home() {
  redirect("/soundscape");
}
