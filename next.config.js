process.env.NODE_ENV = "production"; // enforce production mode for hosting panel defaults
process.env.SWC_THREADS = process.env.SWC_THREADS ?? "1"; // limit SWC concurrency for shared hosting

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
};

module.exports = nextConfig;
