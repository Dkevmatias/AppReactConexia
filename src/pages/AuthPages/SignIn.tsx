import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Portal Codialub"
        description="Portal de acceso para clientes de Codialub"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
