import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import "../../utils/date"

//import Badge from "../ui/badge/Badge";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { getMesPeriodo } from "../../utils/date";
//import { useAuth } from "../../context/AuthContext";

export default function TableBoletos({ res }: { res: any }) {
 // console.log("Tabla",res);
    const data = Array.isArray(res) ? res : [];     

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Headers */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Código de Boleto
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Periodo
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Mes de Rendención
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {data.length === 0 && (
              <TableRow>
               <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                No hay boletos asignados.
              </TableCell>
              </TableRow>
            )}

            {data.map((b: { idBoleto: Key | null | undefined; idPeriodo:number; codigoBoleto: string | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; fecha: string | number | Date; color: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }) => (
              <TableRow key={b.idBoleto}>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                  {b.codigoBoleto}
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                {getMesPeriodo(b.idPeriodo)}
                </TableCell>

                <TableCell className="px-4 py-3 text-start capitalize text-gray-500">
                  {new Date(b.fecha).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

