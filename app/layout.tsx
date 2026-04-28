import "@/styles/index.css"


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="ea-layout-html"
    >
      <body className="ea-layout-body">{children}</body>
    </html>
  );
}
