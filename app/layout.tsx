import type {Metadata} from 'next';
import { 
  Inter, 
  JetBrains_Mono, 
  Orbitron, 
  Roboto, 
  Open_Sans, 
  Lato, 
  Montserrat, 
  Playfair_Display, 
  Merriweather, 
  Ubuntu, 
  Poppins,
  Noto_Sans_Myanmar
} from 'next/font/google'
import './globals.css'; // Global styles

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display' })
const roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-roboto' })
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const merriweather = Merriweather({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-merriweather' })
const ubuntu = Ubuntu({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-ubuntu' })
const poppins = Poppins({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-poppins' })
const notoMyanmar = Noto_Sans_Myanmar({ weight: ['400', '700'], subsets: ['myanmar'], variable: '--font-noto-myanmar' })

export const metadata: Metadata = {
  title: 'ME Translator',
  description: 'A ChatGPT-style translator for English and Myanmar languages with Cyberpunk theme support.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" suppressHydrationWarning className={`
      ${inter.variable} 
      ${jetbrainsMono.variable} 
      ${orbitron.variable}
      ${roboto.variable}
      ${openSans.variable}
      ${lato.variable}
      ${montserrat.variable}
      ${playfair.variable}
      ${merriweather.variable}
      ${ubuntu.variable}
      ${poppins.variable}
      ${notoMyanmar.variable}
    `}>
      <body suppressHydrationWarning className="bg-[#212121] text-white font-sans">{children}</body>
    </html>
  );
}
