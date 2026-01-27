import { PageMeta, SignUpForm } from "../../components";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sigetsop - SignUp"
        description="This is SignUp Tables Dashboard page"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
