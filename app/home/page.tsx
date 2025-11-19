import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to default artist (Hybrid)
  redirect('/home/hybrid');
}
