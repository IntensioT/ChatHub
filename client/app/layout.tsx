import Link from 'next/link';
import LoginPage from './telegram/authorization/login/page';
import VerificationForm from './telegram/authorization/verification/VerificationForm/VerificationForm';

import bg from './telegram/assets/background.jpg'


import Navbar from "./components/navbar/navbar";
import "./components/navbar/navbar.css";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{
        backgroundImage: `url(${bg.src})`}}>
        <nav>
          <ul>
            <li>
              <Link href="/">HomeLESS</Link>
            </li>
            <li>
              <Link href="/telegram/authorization/login">Login</Link>
            </li>
            <li>
              <Link href="/telegram/authorization/verification">Verification</Link>
            </li>
          </ul>
        </nav>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
