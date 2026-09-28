import { useCallback, useState } from "react";
import ModalAlerta, {
  tituloAlertaPorVariant,
  type ModalAlertaVariant,
} from "../components/common/ModalAlerta";

export type AlertaUi = {
  titulo: string;
  mensaje: string;
  variant: ModalAlertaVariant;
};

type MostrarOpts = {
  mensaje: string;
  titulo?: string;
  variant?: ModalAlertaVariant;
};

/**
 * Sustituye `alert()` nativo por un modal visible alineado al diseño de la app.
 */
export function useModalAlerta() {
  const [alerta, setAlerta] = useState<AlertaUi | null>(null);

  const cerrar = useCallback(() => setAlerta(null), []);

  const mostrar = useCallback((opts: MostrarOpts | string) => {
    if (typeof opts === "string") {
      setAlerta({
        titulo: tituloAlertaPorVariant("warning"),
        mensaje: opts,
        variant: "warning",
      });
      return;
    }
    const variant = opts.variant ?? "warning";
    setAlerta({
      titulo: opts.titulo ?? tituloAlertaPorVariant(variant),
      mensaje: opts.mensaje,
      variant,
    });
  }, []);

  const mostrarError = useCallback(
    (mensaje: string, titulo?: string) =>
      mostrar({ mensaje, titulo, variant: "error" }),
    [mostrar],
  );

  const mostrarAdvertencia = useCallback(
    (mensaje: string, titulo?: string) =>
      mostrar({ mensaje, titulo, variant: "warning" }),
    [mostrar],
  );

  const mostrarExito = useCallback(
    (mensaje: string, titulo?: string) =>
      mostrar({ mensaje, titulo, variant: "success" }),
    [mostrar],
  );

  const AlertaHost = (
    <ModalAlerta
      abierto={alerta != null}
      titulo={alerta?.titulo ?? ""}
      mensaje={alerta?.mensaje ?? ""}
      variant={alerta?.variant ?? "warning"}
      onCerrar={cerrar}
    />
  );

  return {
    alerta,
    mostrar,
    mostrarError,
    mostrarAdvertencia,
    mostrarExito,
    cerrar,
    AlertaHost,
  };
}
