import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import "../../utils/date"

import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import { getMesPeriodo } from "../../utils/date";

interface AcumuladoItem {
  mes: number;
  totalVentas: number;
  puntos: number;
}
export default function Acumulado({ res }: { res: any }) {
  console.log("Tablass",res.data);
    const data = Array.isArray(res.data) ? res.data : [];     

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
               Mes
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
               Total de Compras
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                Puntos Acumulados
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            
            {data.length === 0 && (
              <TableRow>
               <TableCell
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                isHeader
              >
                Sin datos que mostrar.
              </TableCell>
              </TableRow>
            )}

            {data.map((b: AcumuladoItem) => (
              <TableRow key={data.length}>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                   {getMesPeriodo(b.mes)}
                </TableCell>
                <TableCell className="px-4 py-3 text-start text-gray-500">
                ${b.totalVentas}
                </TableCell>

                <TableCell className="px-4 py-3 text-start capitalize text-gray-500">
                  {b.puntos}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

