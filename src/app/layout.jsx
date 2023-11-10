import "./globals.css";
import NextAuthSessionProvider from "../providers/sessionProvider";
// import { GlobalProvider } from "./services/state";

export const metadata = {
  title: "Tobias Hub",
  description: "Disciplinando o corpo e a mente",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="pt">
      <body>
        {/* <GlobalProvider>{children}</GlobalProvider> */}
        <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
      </body>
    </html>
  );
};

export default RootLayout;
