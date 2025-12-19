import { BoletoConfirmacion } from "../components/evento/CardBoletos";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  restante: number;
  precioMinimo: number;
  boletos: BoletoConfirmacion[];
}

interface BoletoAgrupado {
  idBoleto: number;
  label: string;
  color: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  //total,
  boletos,
  restante,
  precioMinimo
}: ConfirmModalProps) {
  if (!open) return null;
  
  const colorClasses: Record<string, string> = {
  Negro: "bg-black text-white border-black",
  Amarillo: "bg-yellow-400 text-black border-yellow-500",
  Gris: "bg-gray-400 text-black border-gray-500"
};
  const boletosAgrupados: BoletoAgrupado[] = Object.values(
  boletos.reduce<Record<number, BoletoAgrupado>>((acc, boleto) => {
    if (!acc[boleto.idBoleto]) {
      acc[boleto.idBoleto] = {
        idBoleto: boleto.idBoleto,
        label: boleto.label,
        color: boleto.color,
        cantidad: 0,
        precioUnitario: boleto.precio,
        total: 0
      };
    }

    acc[boleto.idBoleto].cantidad += 1;
    acc[boleto.idBoleto].total += boleto.precio;

    return acc;
  }, {})
);

  

  //const listaBoletos = Array.isArray(boletos) ? boletos : [];
  //console.log("listaBoletos en modal:", listaBoletos);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-6 animate-fadeIn scale-100">

        {/* TITULO */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Confirmar selección
        </h2>
        {boletosAgrupados.length > 0 ? (
      boletosAgrupados.map((boleto) => (
      <div key={boleto.idBoleto} className={`border rounded-lg p-3 mb-3
        ${colorClasses[boleto.color] ?? "bg-white text-black"}
      `}>      
      <div className="font-bold">{boleto.label}</div>      
      <div className="text-sm text-gray-500">
        Cantidad: {boleto.cantidad}
      </div>      
    </div>
      ))) : 
      (
        <p className="text-center text-sm text-gray-500">
        No hay boletos seleccionados
      </p>)
      }
      {restante >= precioMinimo && (
  <div className="mt-4 bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg p-3">
    ⚠️ Aún tienes <strong>{restante}</strong> puntos disponibles.
    <br />
    Si continúas, estos puntos <strong>se perderán</strong> ya que no son acumulables.
  </div>
)}
  

        {/* BOTONES */}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition font-semibold"
          >
            Cancelar
          </button>

          <button
          onClick={onConfirm}
  className={`px-4 py-2 rounded-lg font-semibold transition
    ${restante >= precioMinimo
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white"}
  `}
>
  {restante >= precioMinimo
    ? "Confirmar y perder puntos"
    : "Confirmar selección"}
          </button>
        </div>
      </div>
    </div>
  );
}
