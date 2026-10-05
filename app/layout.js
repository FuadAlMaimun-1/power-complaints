import { Hind_Siliguri } from 'next/font/google';
import './globals.css';

const font = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '700'], display: 'swap' });

export const metadata = {
  title: 'বিদ্যুৎ অভিযোগ | Power Complaints',
  description: 'Anonymous load-shedding and electricity bill complaints by division, district and upazila.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
    <link rel="icon" href="/favicon.ico" />
      <body className={font.className}>{children}</body>
    </html>
  );
}
