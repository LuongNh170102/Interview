import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import "./envConfig.ts";
const withNextIntl = createNextIntlPlugin();
const nextConfig: NextConfig = {};
export default withNextIntl(nextConfig);
