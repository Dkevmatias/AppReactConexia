import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

// Define the TypeScript interface for the table rows
interface Product {
 /*  id: number; // Unique identifier for each product
  name: string; // Product name
  variants: string; // Number of variants (e.g., "1 Variant", "2 Variants")
  category: string; // Category of the product
  price: string; // Price of the product (as a string with currency symbol)
  // status: string; // Status of the product
  image: string; // URL or path to the product image
  status: "Delivered" | "Pending" | "Canceled"; // Status of the product
  /* identrega: NumeroEntrega; */ 

  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalInvoice: string;
  totalPaid: string;
  totalDue: string;
  
}

// Define the table data using the interface
const tableData: Product[] = [
  
   {
    invoiceNumber: "INV-001",
    invoiceDate: "2025-09-01",
    dueDate: "2025-09-15",
    totalInvoice: "$2,399.00",
    totalPaid: "$2,399.00",
    totalDue: "$0.00",
  },
  {
    invoiceNumber: "INV-002",
    invoiceDate: "2025-09-05",
    dueDate: "2025-09-20",
    totalInvoice: "$879.00",
    totalPaid: "$400.00",
    totalDue: "$479.00",
  },
  {
    invoiceNumber: "INV-003",
    invoiceDate: "2025-08-28",
    dueDate: "2025-09-10",
    totalInvoice: "$1,869.00",
    totalPaid: "$1,869.00",
    totalDue: "$0.00",
  },
  {
    invoiceNumber: "INV-004",
    invoiceDate: "2025-09-03",
    dueDate: "2025-09-18",
    totalInvoice: "$1,699.00",
    totalPaid: "$0.00",
    totalDue: "$1,699.00",
  },
  {
    invoiceNumber: "INV-005",
    invoiceDate: "2025-09-06",
    dueDate: "2025-09-21",
    totalInvoice: "$240.00",
    totalPaid: "$240.00",
    totalDue: "$0.00",
  },
  {
    invoiceNumber: "INV-006",
    invoiceDate: "2025-09-08",
    dueDate: "2025-09-23",
    totalInvoice: "$560.00",
    totalPaid: "$100.00",
    totalDue: "$460.00",
  },
  {
    invoiceNumber: "INV-007",
    invoiceDate: "2025-09-09",
    dueDate: "2025-09-25",
    totalInvoice: "$1,150.00",
    totalPaid: "$1,000.00",
    totalDue: "$150.00",
  },
  {
    invoiceNumber: "INV-008",
    invoiceDate: "2025-09-10",
    dueDate: "2025-09-26",
    totalInvoice: "$725.00",
    totalPaid: "$0.00",
    totalDue: "$725.00",
  },
  {
    invoiceNumber: "INV-009",
    invoiceDate: "2025-09-11",
    dueDate: "2025-09-27",
    totalInvoice: "$999.99",
    totalPaid: "$999.99",
    totalDue: "$0.00",
  },
  {
    invoiceNumber: "INV-010",
    invoiceDate: "2025-09-12",
    dueDate: "2025-09-28",
    totalInvoice: "$305.00",
    totalPaid: "$100.00",
    totalDue: "$205.00",
  },
  {
    invoiceNumber: "INV-011",
    invoiceDate: "2025-09-13",
    dueDate: "2025-09-29",
    totalInvoice: "$1,380.00",
    totalPaid: "$380.00",
    totalDue: "$1,000.00",
  },
  {
    invoiceNumber: "INV-012",
    invoiceDate: "2025-09-14",
    dueDate: "2025-09-30",
    totalInvoice: "$450.00",
    totalPaid: "$450.00",
    totalDue: "$0.00",
  },
  {
    invoiceNumber: "INV-013",
    invoiceDate: "2025-09-15",
    dueDate: "2025-10-01",
    totalInvoice: "$1,999.99",
    totalPaid: "$0.00",
    totalDue: "$1,999.99",
  },
  {
    invoiceNumber: "INV-014",
    invoiceDate: "2025-09-16",
    dueDate: "2025-10-02",
    totalInvoice: "$320.00",
    totalPaid: "$320.00",
    totalDue: "$0.00",
  },
  {
    invoiceNumber: "INV-015",
    invoiceDate: "2025-09-17",
    dueDate: "2025-10-03",
    totalInvoice: "$760.00",
    totalPaid: "$360.00",
    totalDue: "$400.00",
  },
  
];

export default function ClientesFP() {
  return (
    <div className="overflow-hidden md-60 ml-60 mr-60 w-330 rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Facturas Pendientes
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <svg
              className="stroke-current fill-white dark:fill-gray-800"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.29004 5.90393H17.7067"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.7075 14.0961H2.29085"
                stroke=""
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12.0826 3.33331C13.5024 3.33331 14.6534 4.48431 14.6534 5.90414C14.6534 7.32398 13.5024 8.47498 12.0826 8.47498C10.6627 8.47498 9.51172 7.32398 9.51172 5.90415C9.51172 4.48432 10.6627 3.33331 12.0826 3.33331Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
              <path
                d="M7.91745 11.525C6.49762 11.525 5.34662 12.676 5.34662 14.0959C5.34661 15.5157 6.49762 16.6667 7.91745 16.6667C9.33728 16.6667 10.4883 15.5157 10.4883 14.0959C10.4883 12.676 9.33728 11.525 7.91745 11.525Z"
                fill=""
                stroke=""
                strokeWidth="1.5"
              />
            </svg>
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Número de Factura
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha de Factura
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha de Vencimiento
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total de Factura
              </TableCell>

               <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total Pagado
              </TableCell>

               <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Total Pendiente
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((product) => (

              
              <TableRow key={product.invoiceNumber} className="">
                
                
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
  {product.invoiceNumber}
</TableCell>
<TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
  {product.invoiceDate}
</TableCell>
<TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
  {product.dueDate}
</TableCell>
<TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
  {product.totalInvoice}
</TableCell>
<TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
  {product.totalPaid}
</TableCell>
<TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
  {product.totalDue}
</TableCell>
              </TableRow>
              
            ))}
          </TableBody>
        </Table>
      </div> 

</div>



  
  );
}







