export type EnvConfig = {
  clientId: string;
  apiUrl: string;
  clientSecret: string;
};

const { clientId, apiUrl, clientSecret } = process.env;

export default function parseEnvironment(): EnvConfig {
  if (!clientId) {
    throw new Error("Missing clientId in environment.");
  }
  if (!apiUrl) {
    throw new Error("Missing apiUrl in environment.");
  }
  if (!clientSecret) {
    throw new Error("Missing clientSecret in environment.");
  }
  return {
    clientId,
    apiUrl,
    clientSecret,
  };
}
