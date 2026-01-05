
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { JSX } from "react";

interface ProtectedRouteProps {
  children: JSX.Element;
  roles?: number[]; 
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user,loading } = useAuth();

   if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

