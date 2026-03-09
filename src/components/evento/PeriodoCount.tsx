import { useEffect, useState } from "react";

export default function PeriodoCount({ fechaInicio }: { fechaInicio: string }) {
  const [tiempoRestante, setTiempoRestante] = useState("");

  useEffect(() => {
    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const apertura = new Date(fechaInicio).getTime();
      const diferencia = apertura - ahora;

      if (diferencia <= 0) {
        setTiempoRestante("¡El periodo ya está activo!");
        clearInterval(intervalo);
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
      const minutos = Math.floor((diferencia / (1000 * 60)) % 60);

      setTiempoRestante(`${dias}d ${horas}h ${minutos}m`);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [fechaInicio]);

  return (
    <div className="bg-yellow-100 text-yellow-800 p-3 rounded-xl text-center font-semibold mb-4">
      ⏳ El periodo abre en: {tiempoRestante}
    </div>
  );
}