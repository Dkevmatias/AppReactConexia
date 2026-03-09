import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { useAuth } from "../../context/useAuth";
import { loginService } from "../../services/authService";
import ThemeTogglerTwo from "../common/ThemeTogglerTwo";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export default function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { executeRecaptcha } = useGoogleReCaptcha();
  
  const [requireCaptcha, setRequireCaptcha] = useState(false);
 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
   try {
    let recaptchaToken: string | null = null;

    // Solo ejecutar captcha si ya es requerido
    if (requireCaptcha) {
      if (!executeRecaptcha) {
        setError("Error cargando reCAPTCHA");
        setLoading(false);
        return;
      }

      recaptchaToken = await executeRecaptcha("login");
    }

    const response = await loginService(email, password, recaptchaToken);
    if (!response.isSuccess) {
      if (response.requireCaptcha) {
        setRequireCaptcha(true);
        setError("Se activó una verificación adicional de seguridad.");
  } else {
    setError("Credenciales inválidas");
  }
  return;
}    
    login(response.user);
    navigate("/dashboard/evento");

  } catch (err: any) {

  const data = err?.response?.data;

  if (data) {

    if (data.requireCaptcha) {
      setRequireCaptcha(true);
      setError("Se requiere verificación adicional.");
      return;
    }

    setError(data.message || "Credenciales incorrectas");
  } 
  else {
    setError("Error de conexión con el servidor");
  }
  }
  finally {
        setLoading(false);
      }
    };
  
  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
             {/* Logo Encabezado */}
            <div className="mt-2 pt-6 border-gray-200">
              <div className="flex flex-wrap items-center justify-center gap-4 ">
                <img src="/images/page/encabezadologin.png" alt=" encabezado" 
                className="block mx-auto max-w-full h-auto transition block dark:hidden" />

                <img src="/images/page/encabezadodark.png" alt=" encabezado" 
                className="block mx-auto max-w-full h-auto transition hidden dark:block" />
              </div>
            </div> 
        <div>
          <div className="mb-5 sm:mb-8 flex flex-col items-center">                
                <h1
                  className="font-semibold text-gray-800 dark:text-white/90 
                            text-lg sm:text-xl lg:text-2xl text-center"
                  style={{ fontFamily: "Conthrax" }}
                >
                  Bienvenido a tu cuenta
                </h1>

                <h2
                  className="font-semibold text-gray-800 dark:text-white/90 
                            text-base sm:text-sm xs:text-2xl text-center"
                  style={{ fontFamily: "Conthrax" }}
                >
                  Cada compra te acerca a grandes premios
                </h2>
            </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label>
                  Usuario <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="info@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>
                  Contraseña <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"} // CORREGIDO
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}                    
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? ( //CORREGIDO
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>
                 {/* MENSAJE DE ERROR 
              {error && (
                <p className="mt-2 text-sm text-red-600">
                  {error}
                </p>
              )}*/}
              </div>
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={isChecked} onChange={setIsChecked} />
                  <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                    Recordar
                  </span>
                </div>
              </div>
              <div className="mb-6 flex flex-col items-center gap-3">
                  <h1
                    className="font-semibold text-gray-800 dark:text-white/90 
                              text-lg sm:text-xl xs:text-2xl text-center"
                    style={{ fontFamily: "Conthrax" }}
                  > Sigue avanzando con CODIALUB
                  </h1>            
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </div>            
                   {requireCaptcha && (
                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded text-sm text-center">
                    Detectamos varios intentos fallidos.  
                    Por favor vuelve a intentar. Se realizará una verificación de seguridad.
                  </div>
                )}
                    
                                            
              {/* Logos de marcas - Footer */}
               <div className="mt-8 pt-6 border-gray-200">
              <div className="flex items-center gap-4">
                 <img
                  src="/images/page/marcas.png"
                  alt="Marca 1"
                  className="h-30 hover:grayscale-0 transition dark:hidden"
                />
                 <img
                src="/images/page/marcaswhite.png"
                alt="Marcas"
                className="h-30 transition hidden dark:block"
              />
                  {/* TOGGLER A LA DERECHA */}
                  <div className="ml-auto hidden sm:block sticky top-20 z-70">
                    <ThemeTogglerTwo />
                  </div>
                </div>
              </div>                              
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


