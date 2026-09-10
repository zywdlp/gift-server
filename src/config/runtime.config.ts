const PRODUCTION_ENVIRONMENTS = new Set(["prod", "production"]);

export const resolveRuntimeConfig = (environment = process.env.NODE_ENV || "dev") => {
  const isProduction = PRODUCTION_ENVIRONMENTS.has(environment.trim().toLowerCase());

  return {
    isProduction,
    apiPrefix: isProduction ? "prod-api" : "dev-api",
    envFilePath: isProduction ? ".env.prod" : ".env.dev",
  };
};
