export interface OAuth2Options {
  clientId: string | undefined;
  redirectUrl: string | undefined;
}

export default function parseEnvironment(): OAuth2Options {
  const clientId: string | undefined = process.env.clientId;
  const redirectUrl: string | undefined = process.env.redirectUrl;
  if (!process.env.clientId) {
    throw new Error("Missing client ID in environment.");
  }

  if (!process.env.redirectUrl) {
    throw new Error("Missing redirect URI in environment.");
  }

  return {
    clientId,
    redirectUrl,
  };
}
