/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lwbralutivsfrbdcqbwm.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Cegah clickjacking — halaman tidak boleh di-embed di iframe pihak lain
          { key: "X-Frame-Options", value: "DENY" },
          // Cegah browser menebak content-type sendiri (MIME sniffing)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Paksa HTTPS minimal 1 tahun
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Batasi info referrer ke origin saja
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Batasi akses fitur browser sensitif yang tidak dipakai
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy
          // - default: hanya dari origin sendiri
          // - script: self + Next.js inline scripts (unsafe-inline diperlukan untuk next/font & hydration)
          // - style: self + Google Fonts + inline (dibutuhkan Tailwind inline styles)
          // - font: self + Google Fonts CDN (sementara, akan dihapus setelah migrasi next/font)
          // - img: self + data URI + Supabase storage
          // - connect: self + Supabase API
          // - frame-ancestors: none — konsisten dengan X-Frame-Options
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: blob: https://*.supabase.co",
              "media-src 'self' blob:",
              // dl.polyhaven.org dibutuhkan oleh @react-three/drei Environment preset untuk fetch file HDR
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://dl.polyhaven.org",
              "worker-src blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/karya",
        destination: "/showcase",
        permanent: true,
      },
      {
        source: "/karya/:path*",
        destination: "/showcase/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
