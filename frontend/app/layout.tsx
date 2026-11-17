import "./globals.css";
export const metadata = { title: "FlameAtlas | The Flamels", description: "Microgravity combustion evidence dashboard" };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
