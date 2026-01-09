// pages/AuthPages/ActivateAccount.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  validarActivacionToken, 
  activarCuenta 
} from "../../services/activacionServices";
import Button from "../../components/ui/button/Button";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { EyeCloseIcon, EyeIcon } from "../../icons";

export default function ActivarCuenta() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Estados de validación
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [cardCode, setCardCode] = useState("");
  const [error, setError] = useState("");

  // Estados del formulario
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [emailError, setEmailError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activating, setActivating] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (!emailRegex.test(value)) {
      setEmailError("Correo electrónico no válido");
    } else {
      setEmailError("");
    }
  };

  // Validación de fortaleza de contraseña
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setError("Token inválido o faltante en la URL");
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        setLoading(true);
        const result = await validarActivacionToken(token);

        if (result.isValid) {
          setTokenValid(true);
          setCardCode(result.cardCode);
          setNombre(result.nombre);
        } else {
          setError(result.message);
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message || 
          "Error validando token. Por favor contacta al administrador."
        );
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  // Validar fortaleza de contraseña en tiempo real
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("El correo electrónico es obligatorio");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!passwordStrength.hasUpperCase || !passwordStrength.hasLowerCase) {
      setError("La contraseña debe contener mayúsculas y minúsculas");
      return;
    }

    try {
      setActivating(true);
      setError("");

      await activarCuenta({
        token: token!,
        newPassword,
        confirmPassword,
        email
      });

      alert("🎉 ¡Cuenta activada exitosamente! Ahora puedes iniciar sesión.");
      navigate("/signin");
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        "Error activando cuenta. Intenta nuevamente."
      );
    } finally {
      setActivating(false);
    }
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 animate-pulse">
            Validando token de activación...
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">Token Inválido</h2>
              <p className="mb-2 text-gray-600 dark:text-gray-400">{error}</p>
              <Button className="w-full mt-6" onClick={() => navigate("/signin")}>
                Ir al Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario de activación
  return (
  <div className="min-h-screen bg-[var(--color-gray-light)] flex items-center justify-center p-4 overflow-x-hidden">
  <div className="w-full max-w-7xl">
    {/* TARJETA */}
    <div className="relative group bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] w-full">          
        
        {/* COLUMNA IZQUIERDA */}
        <div className="p-6 lg:p-10 bg-white relative overflow-y-auto max-h-screen">
          {/* Gradiente de fondo */}
          <div
            className="hidden lg:block absolute inset-0 bg-no-repeat bg-right bg-contain pointer-events-none "
            style={{
              backgroundImage: "url('/images/page/gradient.png')"
            }}
          />
          
          {/* Contenido con z-index para que esté encima del gradiente */}
          <div className="relative z-10">
            {/* Logo y título */}
            <div className="mb-6 flex flex-col items-center text-center">
              <img
                src="/images/page/logo-encabezado.png" 
                alt="Logo" 
                className="w-32 md:w-44 lg:w-52 h-auto mb-3"
              />
              <h1 className="text-lg lg:text-xl font-semibold" style={{ fontFamily: "Conthrax" }}>
                Activa tu cuenta
              </h1>
              <p className="text-sm text-gray-600" style={{ fontFamily: "Conthrax" }}>
                Configura tu correo y contraseña para comenzar
              </p>
            </div>

            {/* Info del usuario */}
            <div className="mb-5 p-3 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
              <p className="text-xs text-gray-600 mb-1">Activando cuenta para:</p>
              <p className="text-base font-bold text-gray-900">{nombre}</p>
              <p className="text-xs text-gray-600">
                Código de Cliente: <span className="font-semibold">{cardCode}</span>
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <Label className="text-gray-700 font-medium text-sm">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={handleEmailChange}
                  className={`mt-1 ${emailError ? "border-red-500" : ""}`}
                />
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>

              {/* Nueva Contraseña */}
              <div>
                <Label className="text-gray-700 font-medium text-sm">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 size-5" />
                    )}
                  </button>
                </div>

                {/* Indicadores de fortaleza */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${passwordStrength.hasMinLength ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className={passwordStrength.hasMinLength ? "text-green-600" : "text-gray-500"}>
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${passwordStrength.hasUpperCase && passwordStrength.hasLowerCase ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className={passwordStrength.hasUpperCase && passwordStrength.hasLowerCase ? "text-green-600" : "text-gray-500"}>
                        Mayúsculas y minúsculas
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${passwordStrength.hasNumber ? "bg-green-500" : "bg-gray-300"}`} />
                      <span className={passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}>
                        Al menos un número
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <Label className="text-gray-700 font-medium text-sm">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 size-5" />
                    )}
                  </button>
                </div>

                {/* Indicador de coincidencia */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 mt-1.5 text-xs">
                    {newPassword === confirmPassword ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-600">Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-600">Las contraseñas no coinciden</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Botón de activación */}
              <button
                type="submit"
                className="w-full flex items-center justify-center rounded-lg bg-sky-500 px-4 py-3 font-semibold text-white transition-all duration-300 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:bg-sky-300 shadow-lg hover:shadow-xl text-sm"
                disabled={
                  activating ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  !email ||
                  newPassword.length < 8
                }
              >
                {activating ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Activando cuenta...
                  </span>
                ) : (
                  "Activar mi cuenta"
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                ¿Ya tienes cuenta activa?{" "}
                <button
                  onClick={() => navigate("/signin")}
                  className="font-semibold text-sky-600 hover:text-sky-700"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
                <div className="hidden lg:block relative w-full overflow-hidden">  
          {/* Imagen de fondo */}
          <img
            src="/images/page/principal.png"
            alt="Fondo"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />                      
        </div> 
        
      </div>
    </div>
  </div>
</div>

  );
}
