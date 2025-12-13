
import { FormEvent, useState } from "react";
import {  useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { getPeriodoEvaluar, getSaldoClientes, getPersonas, getVentasCLientes,  login as loginService} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { useVenta } from "../../context/VentaContext";
import { useVencido } from "../../context/SaldoContext";


export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { setVentaTotal } = useVenta();
  const {setSaldoVencido} = useVencido();
  const navigate = useNavigate();
  const { login } = useAuth();
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await  loginService(username, password);
      if (data.isSuccess) {
      login({
        role: data.user.role,
        idPersona: data.user.idPersona,
        cardCode: data.user.cardCode,
        fullname: data.user.fullname,
      }); 
    }
      //console.log("Login exitoso:", data);
      const personas = await getPersonas(data.user.idPersona);      
      const datacardcode = (Array.isArray(personas) ? personas : [])
                            .filter(p => p?.cardCode)
                            .map(p => p.cardCode)
                            .join(",");
    
  // Llamar a otro endpoint con esos cardCodes
  const responsePeriodo = await getPeriodoEvaluar();
  console.log("Periodo evaluar",responsePeriodo);  
  const responseVentas = await getVentasCLientes( responsePeriodo.fechaInicio,responsePeriodo.fechaFin, datacardcode);
  const responsesaldo= await getSaldoClientes(datacardcode);   
    console.log("Saldo Clientes",responsesaldo.vencido);   
    console.log("Datos finales:", responseVentas);
     const _ventatotal = responseVentas?.[0]?.totalVentas ?? 0;
     //const _ventatotal = 789000;
     //Convertir las Ventas a Puntos
     const puntosAcumulados =Math.round((_ventatotal/1.16)/1000.00); 
     //const puntosAcumulados =Math.round(_ventatotal/1.16); 
         setVentaTotal(puntosAcumulados);
         setSaldoVencido(responsesaldo.vencido);
        navigate("/dashboard/evento");
    } catch (error) {
      console.error("Error en login:", error);
      alert("Credenciales incorrectas o error en servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Bienvenido
            </h1>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Usuario <span className="text-error-500">*</span>{" "}
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Contraseña <span className="text-error-500">*</span>{" "}
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Recordar
                  </span>
                </div>
              </div>
              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


