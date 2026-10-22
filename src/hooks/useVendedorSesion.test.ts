import { describe, expect, it } from "vitest";
import { coincideVendedorSesion } from "./useVendedorSesion";

describe("coincideVendedorSesion", () => {
  const sesion = { username: "VTX01", nombre: "Juan Perez" };

  it("acepta username o nombre sin importar mayúsculas", () => {
    expect(coincideVendedorSesion("vtx01", sesion)).toBe(true);
    expect(coincideVendedorSesion("JUAN PEREZ", sesion)).toBe(true);
  });

  it("rechaza otro vendedor o vacío", () => {
    expect(coincideVendedorSesion("VTX02", sesion)).toBe(false);
    expect(coincideVendedorSesion("", sesion)).toBe(false);
    expect(coincideVendedorSesion("VTX01", { username: "", nombre: "" })).toBe(
      false,
    );
  });
});
