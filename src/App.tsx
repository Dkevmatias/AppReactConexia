import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
/*
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
*/
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Evento from "./pages/Dashboard/Evento";
import Boletos from "./pages/Dashboard/Boletos";
import Reportes from "./pages/Dashboard/Reportes";
import ProtectedRoute from "./routes/ProtectedRoute";
import ActivarCuenta from "./pages/ClientsPages/ActivarCuenta";
import { useAuth } from "./context/useAuth";
import { Navigate } from "react-router-dom";




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
      <Routes>
        {/* Root */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard/Evento" replace />
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />

        {/* Auth */}
        <Route
          path="/signin"
          element={user ? <Navigate to="/dashboard/Evento" replace /> : <SignIn />}
        />
        <Route path="/signup" element={<SignUp />} />

        {/* Activación */}
        <Route path="/activar-cuenta" element={<ActivarCuenta />} />

        {/* Protected */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard/Evento" element={<Evento />} />
          <Route path="/dashboard/Boletos" element={<Boletos />} />
          <Route path="/dashboard/Reportes" element={<Reportes />} />
          {/*
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

          Forms 
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables 
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* UI 
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts 
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            */}
          </Route>

          {/* === Fallback === 
          <Route path="*" element={<NotFound />} />
          */}
        </Routes>
      </Router>
    
  );
}
