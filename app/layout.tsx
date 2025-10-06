export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
