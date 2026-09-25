import { redirect } from 'next/navigation';

// The marketing landing lives in /landing as a static site (GitHub Pages).
// The app itself starts at login; logged-in users are sent on to the dashboard by the middleware.
export default function Home() {
  redirect('/login');
}
