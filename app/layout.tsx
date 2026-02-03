import "./globals.css";
import AuthWrapper from "./AuthWrapper";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he">
      <body>
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}