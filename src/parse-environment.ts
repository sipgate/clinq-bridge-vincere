export interface OAuth2Options {
  clientId: string | undefined;
  apiUrl: string | undefined;
  clientSecret: string | undefined;
}

export default function parseEnvironment(): OAuth2Options {
  const clientId: string | undefined = process.env.clientId;
  const apiUrl: string | undefined = process.env.apiUrl;
  const clientSecret: string | undefined = process.env.clientSecret;
  if (!process.env.clientId) {
    throw new Error("Missing clientId in environment.");
  }
  if (!process.env.apiUrl) {
    throw new Error("Missing apiUrl in environment.");
  }
  if (!process.env.clientSecret) {
    throw new Error("Missing clientSecret in environment.");
  }
  return {
    clientId,
    apiUrl,
    clientSecret,
  };
}
