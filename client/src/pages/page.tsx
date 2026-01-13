import { Navigate } from 'react-router-dom';

export default function Home() {
  // For now, redirect to login. Future: Landing page.
  return <Navigate to="/login" replace />;
}
