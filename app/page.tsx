import { getCurrentUser } from '../lib/session';
import Landing from '../components/Landing';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const user = await getCurrentUser();
  return <Landing user={user ? { name: user.name, email: user.email, avatar: user.avatar } : null} />;
}
