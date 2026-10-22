import { describe, expect, it } from "vitest";
import { mensajeErrorDesdeApi } from "./clienteService";

describe("mensajeErrorDesdeApi", () => {
  it("prioriza errors de ASP.NET sobre el título genérico", () => {
    expect(
      mensajeErrorDesdeApi(
        {
          title: "One or more validation errors occurred.",
          status: 400,
          errors: {
            IdEmpresa: ["The IdEmpresa field is required."],
            CardCode: ["The CardCode field is required."],
          },
        },
        "fallback",
      ),
    ).toBe(
      "The IdEmpresa field is required. The CardCode field is required.",
    );
  });

  it("lee ModelState de Web API", () => {
    expect(
      mensajeErrorDesdeApi(
        {
          Message: "The request is invalid.",
          ModelState: {
            "request.idEmpresa": ["The idEmpresa field is required."],
          },
        },
        "fallback",
      ),
    ).toContain("The idEmpresa field is required.");
  });
});
