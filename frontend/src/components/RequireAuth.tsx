import { Navigate, Outlet } from 'react-router-dom';
import { type User } from 'firebase/auth';

const RequireAuth = ({ user }: { user: User | null }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
