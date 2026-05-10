import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { MuiThemeProviderBridge } from "./context/MuiThemeProviderBridge.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { VentaProvider } from "./context/VentaContext.tsx";
import { SaldoProvider } from "./context/SaldoContext.tsx";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ErrorBoundary } from "./components/common/ErrorBoundary.tsx";
import { ComprasProvider } from "./context/ComprasContext.tsx";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleReCaptchaProvider
      reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "head",
      }}
    >
      <ErrorBoundary>
        <AuthProvider>
          <VentaProvider>
            <SaldoProvider>
              <ComprasProvider>
                <ThemeProvider>
                  <MuiThemeProviderBridge>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <AppWrapper>
                        <App />
                      </AppWrapper>
                    </LocalizationProvider>
                  </MuiThemeProviderBridge>
                </ThemeProvider>
              </ComprasProvider>
            </SaldoProvider>
          </VentaProvider>
        </AuthProvider>
      </ErrorBoundary>
    </GoogleReCaptchaProvider>
  </StrictMode>,
);
