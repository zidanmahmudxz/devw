import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Wafid Slip Manager',
  description: 'Manage and auto-submit Wafid medical examination appointments',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
            },
            success: { iconTheme: { primary: '#6F1D46', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
