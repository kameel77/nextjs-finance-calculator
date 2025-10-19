const allowedNodeEnvs = ["development", "test", "production"];
if (!allowedNodeEnvs.includes(process.env.NODE_ENV ?? "")) {
  process.env.NODE_ENV = "production"; // enforce production mode for hosting panel defaults
}

if (process.env.SWC_THREADS === undefined) {
  process.env.SWC_THREADS = "1"; // limit SWC concurrency for shared hosting
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

module.exports = nextConfig;
