import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistNav } from "@/components/artist-nav";
import { HomeClient } from "./home-client";
import { createClient } from "@/lib/supabase/server";

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to default artist (Hybrid)
  redirect('/home/hybrid');
}
