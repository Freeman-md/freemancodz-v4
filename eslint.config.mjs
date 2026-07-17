import nextVitals from "eslint-config-next/core-web-vitals";

const config = [...nextVitals, { ignores: ["src/generated/prisma/**"] }];

export default config;
