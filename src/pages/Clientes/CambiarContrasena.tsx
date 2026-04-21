import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../../services/apiServices";

export default function CambiarContrasena() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
  });

  useEffect(() => {
    setPasswordStrength({
      hasMinLength: passwordNueva.length >= 8,
      hasUpperCase: /[A-Z]/.test(passwordNueva),
      hasLowerCase: /[a-z]/.test(passwordNueva),
      hasNumber: /[0-9]/.test(passwordNueva),
    });
  }, [passwordNueva]);

  const validar = () => {
    if (!email.trim()) {
      setError("El correo es requerido");
      return false;
    }
    if (!passwordNueva.trim()) {
      setError("La nueva contraseña es requerida");
      return false;
    }
    if (passwordNueva.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    if (!passwordStrength.hasUpperCase || !passwordStrength.hasLowerCase) {
      setError("La contraseña debe contener mayúsculas y minúsculas");
      return false;
    }
    if (passwordNueva !== passwordConfirmar) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validar()) return;

    setLoading(true);
    try {
      await api.post("/api/Acceso/ActualizarPassword", {
        email,
        newPassword: passwordNueva,
        confirmPassword: passwordConfirmar,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || "Error al actualizar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Cambiar Contraseña
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ingresa tu correo y crea una nueva contraseña
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Contraseña actualizada correctamente. Redirigiendo al login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                disabled={loading || success}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showPasswordNueva ? "text" : "password"}
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  disabled={loading || success}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordNueva(!showPasswordNueva)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordNueva && (
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirmar nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                  placeholder="Repite tu contraseña"
                  disabled={loading || success}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {passwordConfirmar && (
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  {passwordNueva === passwordConfirmar ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Las contraseñas coinciden</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-600">Las contraseñas no coinciden</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-2 bg-black dark:bg-gray-700 text-white rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {loading ? "Actualizando..." : success ? "Actualizado" : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}