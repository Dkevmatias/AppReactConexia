import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getUsuarioPorId } from "../services/authService";

export type VendedorSesion = {
  listo: boolean;
  idUsuario: number;
  username: string;
  nombre: string;
};

function norm(v: string | null | undefined): string {
  return (v ?? "").trim();
}

export function coincideVendedorSesion(
  valor: string | null | undefined,
  sesion: Pick<VendedorSesion, "username" | "nombre">,
): boolean {
  const actual = norm(valor).toLowerCase();
  if (!actual) return false;
  return [sesion.username, sesion.nombre]
    .map((s) => norm(s).toLowerCase())
    .filter(Boolean)
    .includes(actual);
}

/** Resuelve slpName/username del usuario logueado vía GET /api/Usuarios/{idUsuario}. */
export function useVendedorSesion(): VendedorSesion {
  const { user } = useAuth();
  const [state, setState] = useState<VendedorSesion>({
    listo: false,
    idUsuario: user?.idUsuario ?? 0,
    username: norm(user?.username),
    nombre: norm(user?.fullname),
  });

  useEffect(() => {
    const idUsuario = user?.idUsuario ?? 0;
    if (!idUsuario) {
      setState({ listo: true, idUsuario: 0, username: "", nombre: "" });
      return;
    }

    let cancelado = false;
    setState((prev) => ({
      ...prev,
      listo: false,
      idUsuario,
      username: norm(user?.username) || prev.username,
      nombre: norm(user?.fullname) || prev.nombre,
    }));

    void (async () => {
      let usuario = null;
      try {
        usuario = await getUsuarioPorId(idUsuario);
      } catch {
        usuario = null;
      }
      if (cancelado) return;
      setState({
        listo: true,
        idUsuario: usuario?.idUsuario || idUsuario,
        username: norm(usuario?.username) || norm(user?.username),
        nombre: norm(usuario?.nombre) || norm(user?.fullname),
      });
    })();

    return () => {
      cancelado = true;
    };
  }, [user?.idUsuario, user?.username, user?.fullname]);

  return state;
}
