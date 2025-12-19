interface PeriodoAlertProps {
  periodoActivo: boolean;
  tieneBoletos: boolean;
  saldoVencido:boolean;
}

export default function PeriodoAlert({ periodoActivo, tieneBoletos, saldoVencido }: PeriodoAlertProps) {
  
  // No hay periodo activo
  if (!periodoActivo) {
    return (
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        La selección de boletos no está disponible en este periodo.
      </div>      
    );
  }

  // Periodo activo pero ya tiene boletos
  if (tieneBoletos) {
    return (
      <div className="text-center p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl">
        Ya cuenta con boletos asignados en este periodo.
      </div>
    );
  }
//Saldo vencido 
  if(saldoVencido){
    return(
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        Estimado Cliente, tienes un saldo vencido que deberas cubrir para poder seleccionar boletos.
        Puedes Contactar a tu asesor para cualquier aclaración.
      </div>
    );
  }

  //Periodo activo y No tiene boletos
  return (
    <div className="text-center p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl">
      Puede seleccionar sus boletos para este periodo.
    </div>
  );

  
}
