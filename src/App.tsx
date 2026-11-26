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
import EntregasPremios from "./pages/ConfigPage/EntregasPremios";
import CrmConfiguracion from "./pages/CRM/CrmConfiguracion";
import CrmCatalogos from "./pages/CRM/CrmCatalogos";
import CrmClientes from "./pages/CRM/CrmClientes";
import CrmSeguimientos from "./pages/CRM/CrmSeguimientos";
import Prospectos from "./pages/CRM/Prospectos";
import ProspectoFormPage from "./pages/CRM/ProspectoFormPage";
import Articulos from "./pages/Ventas/Articulos";
import ListaPrecios from "./pages/Ventas/ListaPrecios";
import BitacoraCobranza from "./pages/Operaciones/BitacoraCobranza";
import ListaBitacorasCobranza from "./pages/Operaciones/ListaBitacorasCobranza";
import ComprobacionRutas from "./pages/Operaciones/ComprobacionRutas";
import ManagerComprobacionRuta from "./pages/Operaciones/ListadoIncidencias";
import ListadoFotosDistribucion from "./pages/Operaciones/ListadoFotosDistribucion";
import ReportesOperaciones from "./pages/Operaciones/Reportes";
import ControlCedis from "./pages/Operaciones/ControlCedis";
import ListaEntregasMercancia from "./pages/Operaciones/ListaEntregasMercancia";
import ControlFacturas from "./pages/Operaciones/ControlFacturas";
import Cotizador from "./pages/Ventas/Cotizador";

/* NOMCONEXIA-UNIFY */
const NominaHome = lazy(() => import("./pages/Nomina/Home"));
const NominaEmpleados = lazy(() => import("./pages/Nomina/Empleados"));
const NominaEmpresas = lazy(() => import("./pages/Nomina/Empresas"));
const NominaCatalogos = lazy(() => import("./pages/Nomina/Catalogos"));
const NominaIncidencias = lazy(() => import("./pages/Nomina/Incidencias"));
const NominaSolicitudes = lazy(() => import("./pages/Nomina/Solicitudes"));
const ReporteChecador = lazy(() => import("./pages/Nomina/ReporteChecador"));
const RelojAdmin = lazy(() => import("./pages/Nomina/RelojAdmin"));
const NominaPercepciones = lazy(() => import("./pages/Nomina/Percepciones"));
const NominasPage = lazy(() => import("./pages/Nominas/Nominas"));
const NominaGps = lazy(() => import("./pages/GPS/GPSPage"));
/* /NOMCONEXIA-UNIFY */

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

          {/* Recuperación de contraseña (sin login; con token usa ConfirmarPasswordReset) */}
          <Route
            path="/clientes/CambiarContrasena"
            element={<CambiarContrasena />}
          />
          <Route
            path="/restablecer-password"
            element={<CambiarContrasena />}
          />

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
            <Route path="/ventas/ListaPrecios" element={<ListaPrecios />} />
            <Route path="/ventas/Cotizador" element={<Cotizador />} />
            <Route
              path="/configPage/Respuesta"
              element={<RespuestaClientes />}
            />
            <Route
              path="/configPage/entregasPremios"
              element={<EntregasPremios />}
            />
            <Route path="/CRM/Prospectos" element={<Prospectos />} />
            <Route
              path="/CRM/Prospectos/nuevo"
              element={<ProspectoFormPage />}
            />
            <Route
              path="/CRM/Prospectos/:idLead"
              element={<ProspectoFormPage />}
            />
            <Route path="/CRM/Seguimientos" element={<CrmSeguimientos />} />
            <Route path="/CRM/Clientes" element={<CrmClientes />} />
            <Route path="/CRM/Configuración" element={<CrmConfiguracion />} />
            <Route path="/CRM/Catalogos" element={<CrmCatalogos />} />
            <Route
              path="/CRM/CatalogoEtapas"
              element={<Navigate to="/CRM/Catalogos?tab=etapas" replace />}
            />
            <Route
              path="/CRM/CatalogoFuentes"
              element={<Navigate to="/CRM/Catalogos?tab=fuentes" replace />}
            />
            <Route
              path="/CRM/CatalogoSeguimientos"
              element={
                <Navigate to="/CRM/Catalogos?tab=seguimientos" replace />
              }
            />
            <Route
              path="/CRM/CatalogoEstatus"
              element={<Navigate to="/CRM/Catalogos?tab=estatus" replace />}
            />
            <Route
              path="/CRM/CatalogoTipoEstatus"
              element={
                <Navigate to="/CRM/Catalogos?tab=tipo-estatus" replace />
              }
            />
            <Route
              path="/operaciones/BitacoraCobranza"
              element={<BitacoraCobranza />}
            />
            <Route
              path="/operaciones/ListaBitacorasCobranza"
              element={<ListaBitacorasCobranza />}
            />
            <Route
              path="/operaciones/ComprobacionRutas"
              element={<ComprobacionRutas />}
            />
            <Route
              path="/operaciones/ManagerComprobacionRuta"
              element={<ManagerComprobacionRuta />}
            />
            <Route
              path="/operaciones/ListadoFotosDistribucion"
              element={<ListadoFotosDistribucion />}
            />
            <Route
              path="/operaciones/Reportes"
              element={<ReportesOperaciones />}
            />
            <Route
              path="/operaciones/ControlCedis"
              element={<ControlCedis />}
            />
            <Route
              path="/operaciones/ListaEntregasMercancia"
              element={<ListaEntregasMercancia />}
            />
            <Route
              path="/operaciones/ControlFacturas"
              element={<ControlFacturas />}
            />
            {/* NOMCONEXIA-UNIFY */}
            <Route path="/nomina" element={<NominaHome />} />
            <Route path="/nomina/empleados" element={<NominaEmpleados />} />
            <Route path="/nomina/empresas" element={<NominaEmpresas />} />
            <Route path="/nomina/catalogos" element={<NominaCatalogos />} />
            <Route path="/nomina/incidencias" element={<NominaIncidencias />} />
            <Route
              path="/nomina/incidencias/checador"
              element={<ReporteChecador />}
            />
            <Route path="/nomina/reloj" element={<RelojAdmin />} />
            <Route path="/nomina/solicitudes" element={<NominaSolicitudes />} />
            <Route
              path="/nomina/percepciones"
              element={<NominaPercepciones />}
            />
            <Route path="/nomina/nominas" element={<NominasPage />} />
            <Route path="/nomina/gps" element={<NominaGps />} />
            {/* /NOMCONEXIA-UNIFY */}
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}
