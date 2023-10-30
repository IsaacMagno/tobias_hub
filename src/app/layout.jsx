import "./globals.css";

export const metadata = {
  title: "Tobias Hub",
  description: "Disciplinando o corpo e a mente",
};

const RootLayout = ({ children }) => {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
