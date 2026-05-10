import type React from "react";
import { useMemo } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import { useTheme } from "./ThemeContext";

/**
 * Alinea el tema de MUI (DatePicker, popovers, etc.) con `ThemeContext` / clase `dark` en `<html>`.
 */
export function MuiThemeProviderBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme === "dark" ? "dark" : "light",
        },
      }),
    [theme],
  );

  return <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>;
}
