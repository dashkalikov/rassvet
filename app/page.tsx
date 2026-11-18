import {publicUser} from '../lib/public-user';
import Landing from '../components/Landing';
export const dynamic = 'force-dynamic';
export default async function Home() {
  return <Landing user={await publicUser()}/>;
}
