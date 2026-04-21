import { BrowserRouter as Router, Routes, Route } from "react-router";
import { lazy, Suspense } from "react";

const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const AppLayout = lazy(() => import("./layout/AppLayout"));
const Evento = lazy(() => import("./pages/Dashboard/Evento"));
const Boletos = lazy(() => import("./pages/Dashboard/Boletos"));
const Reportes = lazy(() => import("./pages/Dashboard/Reportes"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const Terminos = lazy(() => import("./pages/Dashboard/Terminos"));
const Aviso = lazy(() => import("./pages/Dashboard/Aviso"));
const ActivarCuenta = lazy(() => import("./pages/Clientes/ActivarCuenta"));
const Video = lazy(() => import("./pages/Video"));
const Acumulado = lazy(() => import("./pages/Clientes/Acumulado"));
const RealizarSorteo = lazy(() => import("./pages/Sorteo/RealizarSorteo"));

import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import { Navigate } from "react-router-dom";
import { resolvePostLoginPath } from "./config/postLoginRoutes";
import Profile from "./pages/Clientes/Profile";
import CambiarContrasena from "./pages/Clientes/CambiarContrasena";
import RespuestaClientes from "./pages/ConfigPage/RespuestaClientes";
import Articulos from "./pages/Ventas/Articulos";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <Routes>
          {/* Root */}
          <Route
            path="/"
            element={
              user ? (
                <Navigate
                  to={resolvePostLoginPath(user.role, user.defaultRoute)}
                  replace
                />
              ) : (
                <Navigate to="/signin" replace />
              )
            }
          />

          {/* Auth */}
          <Route
            path="/signin"
            element={
              user ? (
                <Navigate
                  to={resolvePostLoginPath(user.role, user.defaultRoute)}
                  replace
                />
              ) : (
                <SignIn />
              )
            }
          />
          <Route path="/signup" element={<SignUp />} />

          {/* Activación */}
          <Route path="/activar-cuenta" element={<ActivarCuenta />} />

          {/* Video público (sin login) — compartir: dominio.com/video */}
          <Route path="/video" element={<Video />} />

          {/* Cambio de contraseña (sin login requerido) */}
          <Route path="/clientes/CambiarContrasena" element={<CambiarContrasena />} />

          {/* Protected */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/sorteo" element={<RealizarSorteo />} />
            <Route path="/dashboard/Evento" element={<Evento />} />
            <Route path="/dashboard/Home" element={<Home />} />
            <Route path="/dashboard/Boletos" element={<Boletos />} />
            <Route path="/dashboard/Reportes" element={<Reportes />} />
            <Route path="/dashboard/Terminos" element={<Terminos />} />
            <Route path="/dashboard/Aviso" element={<Aviso />} />
            <Route path="/clientes/Acumulado" element={<Acumulado />} />
            <Route path="/clientes/Profile" element={<Profile />} />
            <Route path="/ventas/Articulos" element={<Articulos />} />
            <Route
              path="/configPage/Respuesta"
              element={<RespuestaClientes />}
            />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
