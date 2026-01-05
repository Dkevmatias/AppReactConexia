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

    // Validaciones
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

      // Éxito - Mostrar modal o mensaje
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

  // Pantalla de error (token inválido)
  if (!tokenValid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                Token Inválido
              </h2>

              <p className="mb-2 text-gray-600 dark:text-gray-400">{error}</p>

              <div className="p-4 mt-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  💡 <strong>Posibles causas:</strong>
                </p>
                <ul className="mt-2 text-xs text-left text-yellow-700 dark:text-yellow-400 list-disc list-inside">
                  <li>El token ya fue utilizado</li>
                  <li>El token expiró (válido por 48 horas)</li>
                  <li>El enlace está incompleto o corrupto</li>
                </ul>
              </div>

              <Button className="w-full mt-6" onClick={() => navigate("/signin")}>
                Ir al Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla principal (formulario de activación)
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
 

            <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-3 bg-black rounded-full">
             <img  className="dark:hidden"
                src="/images/logo/logocodlub_1.svg"
                alt="Logo"
                width={80}
                height={80}
                
              />
            </div>
            <h1 className="text-2xl font-bold text-white">Activa tu Cuenta</h1>
            <p className="mt-2 text-sm text-green-100">
              Configura tu Correo y Contraseña para comenzar
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Email del usuario */}
            <div className="p-4 mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Activando cuenta para:
              </p>              
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {nombre}                
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Código de Cliente: {cardCode}                
              </p>             
            </div>

            {/* Inicio de Formulario */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label>
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={handleEmailChange}
                  className={emailError ? "border-red-500" : ""}
                />
                 {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
                )}  
              </div>
              {/* Nueva Contraseña */}
              <div>
                <Label>
                  Nueva Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  
                    className="pr-12"
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

                {/* Indicadores de fortaleza */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          passwordStrength.hasMinLength
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasMinLength
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500"
                        }
                      >
                        Mínimo 8 caracteres
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          passwordStrength.hasUpperCase &&
                          passwordStrength.hasLowerCase
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasUpperCase &&
                          passwordStrength.hasLowerCase
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500"
                        }
                      >
                        Mayúsculas y minúsculas
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          passwordStrength.hasNumber
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={
                          passwordStrength.hasNumber
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-500"
                        }
                      >
                        Al menos un número
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <Label>
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                
                    className="pr-12"
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                    )}
                  </span>
                </div>

                {/* Indicador de coincidencia */}
                {confirmPassword && (
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {newPassword === confirmPassword ? (
                      <>
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-green-600 dark:text-green-400">
                          Las contraseñas coinciden
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-red-600 dark:text-red-400">
                          Las contraseñas no coinciden
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mensaje de error */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Botón de activación */}
             <button
  type="submit"
  className="
    w-full
    flex items-center justify-center
    rounded-lg
    bg-sky-500
    px-4 py-3
    font-semibold text-white
    transition-all duration-300
    hover:bg-sky-600
    focus:outline-none focus:ring-2 focus:ring-sky-300
    disabled:cursor-not-allowed
    disabled:bg-sky-300
  "
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
      <svg
        className="h-5 w-5 animate-spin text-white"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      Activando cuenta...
    </span>
  ) : (
    "Activar mi cuenta"
  )}
</button>

            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ¿Ya tienes cuenta activa?{" "}
                <button
                  onClick={() => navigate("/signin")}
                  className="font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🔒 Tu contraseña será encriptada y almacenada de forma segura
          </p>
        </div>
      </div>
    </div>
  );
}