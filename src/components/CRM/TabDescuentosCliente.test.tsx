import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TabDescuentosCliente from "./TabDescuentosCliente";
import { descuentoVacio } from "./clienteAltaUtils";
import { ID_EMPRESA_CODIAL, ID_EMPRESA_CODIALUB } from "./prospectoFormUtils";

const { getMarcas } = vi.hoisted(() => ({
  getMarcas: vi.fn(),
}));

vi.mock("../../services/reportesService", () => ({
  getReportesService: {
    getMarcas,
  },
}));

/** "Codial" es substring de "Codialub"; el name hay que anclarlo. */
const checkboxCodialub = () =>
  screen.getByRole("checkbox", { name: /^codialub/i });
const checkboxCodial = () =>
  screen.getByRole("checkbox", { name: /^codial(?!ub)/i });

describe("TabDescuentosCliente — checks de empresa", () => {
  beforeEach(() => {
    getMarcas.mockResolvedValue([
      {
        idMarca: 1,
        firmName: "Marca Codialub",
        firmCode: 10,
        discountLimit: 20,
        idEmpresa: ID_EMPRESA_CODIALUB,
      },
      {
        idMarca: 2,
        firmName: "Marca Codial",
        firmCode: 20,
        discountLimit: 15,
        idEmpresa: ID_EMPRESA_CODIAL,
      },
    ]);
  });

  it("pide guardar el cliente en CRM antes de configurar descuentos", async () => {
    render(
      <TabDescuentosCliente descuentos={[]} onChange={vi.fn()} />,
    );

    expect(
      await screen.findByText(
        /guarde el cliente en crm antes de configurar descuentos/i,
      ),
    ).toBeInTheDocument();
    expect(checkboxCodialub()).toBeDisabled();
    expect(checkboxCodial()).toBeDisabled();
  });

  it("pide enviar el cliente a SAP antes de habilitar los checks de descuentos", async () => {
    render(
      <TabDescuentosCliente
        descuentos={[]}
        onChange={vi.fn()}
        clientePersistido
      />,
    );

    expect(
      await screen.findByText(/envíe primero el cliente a sap/i),
    ).toBeInTheDocument();
    expect(checkboxCodialub()).toBeDisabled();
  });

  it("habilita Codialub cuando el cliente ya existe en esa sociedad", async () => {
    const onIdEmpresaChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TabDescuentosCliente
        descuentos={[]}
        onChange={vi.fn()}
        clientePersistido
        empresasClienteEnviadas={[ID_EMPRESA_CODIALUB]}
        onIdEmpresaChange={onIdEmpresaChange}
      />,
    );

    expect(await screen.findByRole("checkbox", { name: /^codialub/i })).toBeEnabled();
    const checkCodialub = checkboxCodialub();
    expect(checkboxCodial()).toBeDisabled();

    await user.click(checkCodialub);
    expect(onIdEmpresaChange).toHaveBeenCalledWith(ID_EMPRESA_CODIALUB);
  });

  it("deja consultar Codialub ya enviado y habilita Codial", async () => {
    const onIdEmpresaChange = vi.fn();
    const user = userEvent.setup();

    render(
      <TabDescuentosCliente
        descuentos={[]}
        onChange={vi.fn()}
        clientePersistido
        idEmpresa={ID_EMPRESA_CODIAL}
        empresasClienteEnviadas={[ID_EMPRESA_CODIALUB, ID_EMPRESA_CODIAL]}
        empresasEnviadas={[ID_EMPRESA_CODIALUB]}
        onIdEmpresaChange={onIdEmpresaChange}
      />,
    );

    expect(await screen.findByText("(enviado)")).toBeInTheDocument();
    expect(checkboxCodialub()).toBeEnabled();
    expect(checkboxCodial()).toBeEnabled();

    await user.click(checkboxCodialub());
    expect(onIdEmpresaChange).toHaveBeenCalledWith(ID_EMPRESA_CODIALUB);
  });

  it("pinta descuentos de CRM sin idEmpresa al elegir Codialub y habilita SAP", async () => {
    render(
      <TabDescuentosCliente
        descuentos={[
          {
            ...descuentoVacio({
              firmCode: 10,
              firmName: "Marca Codialub",
              porcentaje: "12",
            }),
            idClienteDescuento: 44,
          },
        ]}
        onChange={vi.fn()}
        clientePersistido
        idEmpresa={ID_EMPRESA_CODIALUB}
        empresasClienteEnviadas={[ID_EMPRESA_CODIALUB]}
        onEnviarDescuentosSap={vi.fn()}
      />,
    );

    expect(await screen.findByDisplayValue("12")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar a sap/i }),
    ).toBeEnabled();
  });

  it("muestra los % de BD aunque Codialub ya se haya enviado", async () => {
    render(
      <TabDescuentosCliente
        descuentos={[
          {
            ...descuentoVacio({
              firmCode: 10,
              firmName: "Marca Codialub",
              porcentaje: "12",
              idEmpresa: ID_EMPRESA_CODIALUB,
            }),
            idClienteDescuento: 5,
            AbsEntry: 99,
            EstatusSync: "Enviado",
          },
        ]}
        onChange={vi.fn()}
        clientePersistido
        idEmpresa={ID_EMPRESA_CODIALUB}
        empresasClienteEnviadas={[ID_EMPRESA_CODIALUB, ID_EMPRESA_CODIAL]}
        empresasEnviadas={[ID_EMPRESA_CODIALUB]}
      />,
    );

    expect(await screen.findByDisplayValue("12")).toBeInTheDocument();
    expect(screen.getByDisplayValue("12")).toBeDisabled();
  });

  it("lista las marcas de la sociedad seleccionada", async () => {
    render(
      <TabDescuentosCliente
        descuentos={[]}
        onChange={vi.fn()}
        clientePersistido
        idEmpresa={ID_EMPRESA_CODIALUB}
        empresasClienteEnviadas={[ID_EMPRESA_CODIALUB]}
      />,
    );

    expect(await screen.findByText("Marca Codialub")).toBeInTheDocument();
    expect(screen.queryByText("Marca Codial")).not.toBeInTheDocument();
  });

  it("lista las marcas de Codial cuando el check es Codial (idEmpresa 2)", async () => {
    render(
      <TabDescuentosCliente
        descuentos={[]}
        onChange={vi.fn()}
        clientePersistido
        idEmpresa={ID_EMPRESA_CODIAL}
        empresasClienteEnviadas={[ID_EMPRESA_CODIALUB, ID_EMPRESA_CODIAL]}
        empresasEnviadas={[ID_EMPRESA_CODIALUB]}
      />,
    );

    expect(await screen.findByText("Marca Codial")).toBeInTheDocument();
    expect(screen.queryByText("Marca Codialub")).not.toBeInTheDocument();
  });
});
