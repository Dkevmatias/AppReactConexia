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

export default function SignInForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user } = await loginService(email, password);
      login(user);
      navigate("/dashboard/evento");
    } catch {
      setError("Credenciales incorrectas");
    } finally {
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
          <div className="mb-5 sm:mb-8 justify-center flex">         
            <h1 className="mb-2  font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md" style={{ fontFamily: "Conthrax" }}>
              Bienvenido
            </h1>
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
                    onChange={(e) => setPassword(e.target.value)}
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
              <div>
                <Button className="w-full" size="sm" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </div>
              
              {/* Logos de marcas - Footer */}
               <div className="mt-8 pt-6 border-gray-200">
              <div className="flex items-center gap-4">
                 <img
                  src="/images/page/marcas.png"
                  alt="Marca 1"
                  className="h-30 hover:grayscale-0 transition"
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


