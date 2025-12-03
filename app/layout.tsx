import "./globals.css";
import TopNav from "@/components/TopNav";

export const metadata = {
  title: "Debt Freedom AI",
  description: "Become debt-free faster with AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 w-full bg-gray-950 overflow-y-auto px-4 sm:px-6 lg:px-10 pt-20 pb-10">
          {children}
        </main>
      </body>
    </html>
  );
}
