import { PageMeta, SignInForm } from "../../components";
import AuthLayout from "./AuthPageLayout";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Sigetsop - SignIn"
        description="This is SignIn Tables Dashboard page"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
