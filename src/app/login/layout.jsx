import { getServerSession } from "next-auth";
import { nextAuthOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

const LoginLayout = async ({ children }) => {
  const session = await getServerSession(nextAuthOptions);

  if (session) {
    redirect("/");
  }

  return <section>{children}</section>;
};

export default LoginLayout;
