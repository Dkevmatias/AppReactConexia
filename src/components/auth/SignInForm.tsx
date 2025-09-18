import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { login } from "../../services/authService";

export default function SignInForm() {
  {/*Variables del form */}
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(username, password); // Llamada a la API
      console.log("Login exitoso:", data);

      // 👉 Si tu API devuelve un token, lo puedes guardar
      localStorage.setItem("token", data.token);
        navigate("/dashboard/home");// Redirige al dashboard
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
          <div>
             <div className="relative py-3 sm:py-5">   
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Usuario <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input placeholder="info@gmail.com"
                  value={username}
                  onChange={(e)=> setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Contraseña <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
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
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {/* Forgot password? */}
                  </Link>
                </div>
                <div>
                  <Button className="w-full" 
                  size="sm"
                   
                  disabled={loading}
                  >
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                </div>
              </div>
            </form>

              <div className="mt-5">
            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
