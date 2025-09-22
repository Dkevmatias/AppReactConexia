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
  /* id: number; // Unique identifier for each product
  name: string; // Product name
  variants: string; // Number of variants (e.g., "1 Variant", "2 Variants")
  category: string; // Category of the product
  price: string; // Price of the product (as a string with currency symbol)
  // status: string; // Status of the product
  image: string; // URL or path to the product image
  status: "Delivered" | "Pending" | "Canceled"; // Status of the product */
   id: number;
  deliveryNumber: string;
  deliveryDate: string;
  commitmentDate: string;
  articleCode: string;
  articleDescription: string;
  quantityDelivered: number;
  pendingCode: string;
}

// Define the table data using the interface
const tableData: Product[] = [
  {
    id: 1,
    deliveryNumber: "ENT-001",
    deliveryDate: "2025-09-01",
    commitmentDate: "2025-09-03",
    articleCode: "A1001",
    articleDescription: "Laptop Dell XPS 13",
    quantityDelivered: 5,
    pendingCode: "PND-001",
  },
  {
    id: 2,
    deliveryNumber: "ENT-002",
    deliveryDate: "2025-09-05",
    commitmentDate: "2025-09-07",
    articleCode: "A1002",
    articleDescription: "Monitor LG 24'",
    quantityDelivered: 10,
    pendingCode: "PND-002",
  },
  {
    id: 3,
    deliveryNumber: "ENT-003",
    deliveryDate: "2025-09-08",
    commitmentDate: "2025-09-10",
    articleCode: "A1003",
    articleDescription: "Teclado Mecánico",
    quantityDelivered: 15,
    pendingCode: "PND-003",
  },
  {
    id: 4,
    deliveryNumber: "ENT-004",
    deliveryDate: "2025-09-10",
    commitmentDate: "2025-09-13",
    articleCode: "A1004",
    articleDescription: "Mouse Inalámbrico",
    quantityDelivered: 20,
    pendingCode: "PND-004",
  },
  {
    id: 5,
    deliveryNumber: "ENT-005",
    deliveryDate: "2025-09-12",
    commitmentDate: "2025-09-14",
    articleCode: "A1005",
    articleDescription: "Webcam HD",
    quantityDelivered: 7,
    pendingCode: "PND-005",
  },
  {
    id: 6,
    deliveryNumber: "ENT-006",
    deliveryDate: "2025-09-13",
    commitmentDate: "2025-09-16",
    articleCode: "A1006",
    articleDescription: "Auriculares Bluetooth",
    quantityDelivered: 12,
    pendingCode: "PND-006",
  },
  {
    id: 7,
    deliveryNumber: "ENT-007",
    deliveryDate: "2025-09-14",
    commitmentDate: "2025-09-17",
    articleCode: "A1007",
    articleDescription: "Impresora HP",
    quantityDelivered: 4,
    pendingCode: "PND-007",
  },
  {
    id: 8,
    deliveryNumber: "ENT-008",
    deliveryDate: "2025-09-15",
    commitmentDate: "2025-09-18",
    articleCode: "A1008",
    articleDescription: "Tablet Samsung",
    quantityDelivered: 9,
    pendingCode: "PND-008",
  },
  {
    id: 9,
    deliveryNumber: "ENT-009",
    deliveryDate: "2025-09-16",
    commitmentDate: "2025-09-19",
    articleCode: "A1009",
    articleDescription: "Disco SSD 1TB",
    quantityDelivered: 18,
    pendingCode: "PND-009",
  },
  {
    id: 10,
    deliveryNumber: "ENT-010",
    deliveryDate: "2025-09-17",
    commitmentDate: "2025-09-20",
    articleCode: "A1010",
    articleDescription: "Cámara Canon",
    quantityDelivered: 3,
    pendingCode: "PND-010",
  },
  {
    id: 11,
    deliveryNumber: "ENT-011",
    deliveryDate: "2025-09-18",
    commitmentDate: "2025-09-21",
    articleCode: "A1011",
    articleDescription: "Proyector Epson",
    quantityDelivered: 2,
    pendingCode: "PND-011",
  },
  {
    id: 12,
    deliveryNumber: "ENT-012",
    deliveryDate: "2025-09-19",
    commitmentDate: "2025-09-22",
    articleCode: "A1012",
    articleDescription: "Router WiFi",
    quantityDelivered: 6,
    pendingCode: "PND-012",
  },
  {
    id: 13,
    deliveryNumber: "ENT-013",
    deliveryDate: "2025-09-20",
    commitmentDate: "2025-09-23",
    articleCode: "A1013",
    articleDescription: "Cargador USB-C",
    quantityDelivered: 25,
    pendingCode: "PND-013",
  },
  {
    id: 14,
    deliveryNumber: "ENT-014",
    deliveryDate: "2025-09-21",
    commitmentDate: "2025-09-24",
    articleCode: "A1014",
    articleDescription: "Fuente de poder",
    quantityDelivered: 11,
    pendingCode: "PND-014",
  },
  {
    id: 15,
    deliveryNumber: "ENT-015",
    deliveryDate: "2025-09-22",
    commitmentDate: "2025-09-25",
    articleCode: "A1015",
    articleDescription: "Switch de red",
    quantityDelivered: 8,
    pendingCode: "PND-015",
  },
];

export default function ClientesOE() {
  return (
    <div className="overflow-hidden md-60 ml-60 mr-60 w-330 rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Ordenes Pendientes de Entrega
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
                Número de Entrega
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha de Entrega
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Fecha Compromiso
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Código de Artículo
              </TableCell>

              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Descripción del Artículo
              </TableCell>

              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Cantidad Entregada
              </TableCell>

              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Código Pendiente
              </TableCell>
            </TableRow>
          </TableHeader>

        
                                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {tableData.map((order) => (
                                          <TableRow key={order.id}>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.deliveryNumber}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.deliveryDate}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.commitmentDate}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.articleCode}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.articleDescription}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.quantityDelivered}
                                            </TableCell>
                                            <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                              {order.pendingCode}
                                            </TableCell>
    </TableRow>
  ))}
</TableBody>

             
          
        </Table>
      </div> 

</div>



  
  );
}







