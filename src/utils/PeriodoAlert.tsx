interface PeriodoAlertProps {
  periodoActivo: boolean;
  
  //'tieneBoletos: boolean;
  saldoVencido:boolean;
}
//Se comenta la variable tieneBoletos ya que se esta utilizando el hook usePeriodoActivo
//  para obtener esa información y no es necesario pasarla como prop,
// ademas de que se esta utilizando en el componente PremiosComponente y 
// no en PeriodoAlert, por lo que se puede eliminar sin afectar la funcionalidad del 
// componente.
export default function PeriodoAlert({ periodoActivo, saldoVencido }: PeriodoAlertProps) {
  
  // No hay periodo activo
  if (!periodoActivo) {
    return (
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        El Canje de puntos estara disponible hasta el mes de Mayo.
      </div>      
    );
  }

  // Periodo activo pero ya tiene boletos
  /*
  if (tieneBoletos) {
    return (
      <div className="text-center p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl">
        Ya cuenta con boletos asignados en este periodo.
      </div>
    );
  }*/
//Saldo vencido 
  if(saldoVencido){
    return(
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        Estimado Cliente, tienes un saldo vencido que deberas cubrir para poder canjear premios.
        Puedes Contactar a tu asesor para cualquier aclaración.
      </div>
    );
  }

  //Periodo activo y No tiene boletos
  return (
    <div className="text-center p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl">
      Puedes canjear tus puntos acumulados por cualquiera de los premios disponibles.
    </div>
  );

  
}
