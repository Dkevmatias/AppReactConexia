import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { asignarBoletos } from "../../services/boletoServices";
import ConfirmModal from "../../utils/ConfirmModal";
import { useNavigate } from "react-router";
import { usePeriodoActivo } from "../../hooks/usePeriodoActivo";
import PeriodoAlert from "../../utils/PeriodoAlert";
type TicketOption = {
  id: string;
  label: string;
  value: number;
  color: string;
  idBoleto: number;
};

const ticketOptions: TicketOption[] = [
  { id: "Negro", label: "Boletos Camionetas", value: 50, color: "bg-black text-white", idBoleto: 1 },
  { id: "Amarillo", label: "Boletos Motos", value: 25, color: "bg-yellow-400 text-black", idBoleto: 2 },
  { id: "Gris", label: "Boleto Computadoras", value: 10, color: "bg-gray-400 text-black", idBoleto: 3 },
];

export default function TicketSelector({ totalCompra,vencido }: { totalCompra: number, vencido: boolean }) {

  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const { periodo,periodoActivo: periodoActivo,tieneBoletos, loading } = usePeriodoActivo();


  // --- Modal states ---
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ total: 0, boletos: {} });
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);
  const maxPorColor = (valor: number) => Math.floor(totalCompra / valor);
  const showConfirm = (data: any, onConfirm: () => void) => {
    setConfirmData(data);
    setOnConfirmCallback(() => onConfirm);
    setOpenConfirm(true);
  };

  const [selected, setSelected] = useState<Record<string, number>>({
    Negro: 0,
    Amarillo: 0,
    Gris: 0,
  });

  const totalSeleccionado = Object.entries(selected).reduce(
    (acc, [id, qty]) => acc + qty * ticketOptions.find(t => t.id === id)!.value,
    0
  );

  const restante = totalCompra - totalSeleccionado;

  const addTicket = (id: string) => {
    if (!periodoActivo) return; // deshabilitar lógica si no hay periodo
    const ticket = ticketOptions.find(t => t.id === id)!;
    if (ticket.value > restante) return;

    setSelected(prev => ({
      ...prev,
      [id]: prev[id] + 1,
    }));
  };

  const removeTicket = (id: string) => {
    if (!periodoActivo) return;

    setSelected(prev => ({
      ...prev,
      [id]: prev[id] > 0 ? prev[id] - 1 : 0,
    }));
  };

  const guardar = () => {
    if (!periodoActivo) return;

    if (!user?.cardCode) {
      alert("Error: No se encontró el ID de la persona.");
      return;
    }

    if (totalSeleccionado === 0) {
      alert("Debe seleccionar al menos un boleto.");
      return;
    }

    showConfirm(
      { total: totalSeleccionado, boletos: selected },
      () => procesarGuardado()
    );
  };

  const procesarGuardado = async () => {
    setIsSaving(true);

    const boletosPayload = Object.entries(selected)
      .filter(([_, qty]) => qty > 0)
      .flatMap(([key, cantidad]) => {
        const ticket = ticketOptions.find(t => t.id === key)!;
        return Array.from({ length: cantidad }).map(() => ({
          idBoleto: ticket.idBoleto,
          color: ticket.id
        }));
      });

    try {
 
      const response = await asignarBoletos(user!.cardCode,periodo!.idPeriodo, boletosPayload);
      alert("Boletos generados con éxito.");
      navigate("/dashboard/boletos", { state: { boletos: response } });
    } catch (error) {
      console.error(error);
      alert("Error al guardar los boletos.");
    }
  };

  // Cargando periodo
  if (loading) return <p className="text-center">Validando disponibilidad...</p>;
  console.log("Validar Periodo:", periodo?.activo);
  console.log("Validar PeriodoBoletos:", tieneBoletos);
  console.log("Validar PeriodoBoletos:", vencido);
  return (
    <div className="max-w-xl mx-auto space-y-5">
      <PeriodoAlert periodoActivo={periodoActivo} tieneBoletos={tieneBoletos} saldoVencido={vencido} />    
       {/* HEADER */}
      <div className="text-center text-lg font-semibold">
        Puntos Acumulados: <span className="text-blue-600">{(totalCompra ?? 0).toLocaleString()}</span>
        <br />
        Puntos Restantes: <span className="text-green-600">{(restante).toLocaleString()}</span>
      </div>
              {/* Mostrar máximos por color */}
    <div className="text-center text-sm text-gray-600">Puedes seleccionar hasta:<br/>

  <div className="flex justify-center gap-2 flex-wrap mt-1">
    {ticketOptions.map((t, index) => (
      <div key={t.id} className="flex items-center">
        <span>
          {t.label}:{maxPorColor(t.value)} boletos   
        </span>
        {/* Agregar la "O" SOLO si no es la última opción */}
        {index < ticketOptions.length - 1 && (
          <span className="mx-2 font-bold text-gray-800">Ó</span>
        )}        
      </div>
    ))} 
    <span className="mx-2 font-bold text-gray-800">Ó</span>
     <div className="text-center text-sm text-gray-600">Una combinación de ellos:
       <br/>
     </div>
  </div>
   
    <div className="text-center text-sm text-gray-600">
      *Recuerda que el total de puntos Sobrantes  no acumulan para el siguiente mes.
      <br/>
  </div>
</div>
         
      {/* Componente Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ticketOptions.map(ticket => {
          const disabled = !periodoActivo || tieneBoletos || vencido;
          //const disabled = !periodoActivo  || (ticket.value > restante && selected[ticket.id] === 0);
          return (
            <div
              key={ticket.id}
              className={`p-4 rounded-xl shadow-md border select-none transition 
                ${ticket.color}
                ${disabled ? "opacity-40 cursor-not-allowed" : "hover:scale-105 cursor-pointer"}
              `}
            >
              <div className="text-center font-bold text-lg">{ticket.label}</div>
              <div className="text-center mt-1">{ticket.value.toLocaleString() + " Puntos C/U"}</div>

              <div className="flex justify-center items-center gap-3 mt-4">
                <button
                  disabled={disabled}
                  onClick={() => removeTicket(ticket.id)}
                  className="px-2 py-1 bg-white text-black rounded-lg shadow hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  -
                </button>

                <span className="text-xl font-bold">{selected[ticket.id]}</span>

                <button
                  disabled={disabled}
                  onClick={() => addTicket(ticket.id)}
                  className="px-2 py-1 bg-white text-black rounded-lg shadow hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
   
      <button
        onClick={guardar}
        disabled={!periodoActivo || totalSeleccionado === 0 || isSaving}
        className={`w-full py-3 rounded-xl font-bold transition
          ${!periodoActivo || totalSeleccionado === 0 || isSaving
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"}
        `}
      >
        {isSaving ? "Guardando..." : "Guardar Selección"}
      </button>

      <ConfirmModal
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        onConfirm={() => {
          setOpenConfirm(false);
          onConfirmCallback?.();
        }}
        total={confirmData.total}
        boletos={confirmData.boletos}
      />
    </div>
  );
}
