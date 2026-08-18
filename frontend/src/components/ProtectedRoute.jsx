import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const status = useSelector((state) => state.auth.status);

  return status ? <Outlet /> : <Navigate replace to="/login" />;
}

export default ProtectedRoute;
