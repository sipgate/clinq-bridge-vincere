export type EnvConfig = {
  clientId: string;
  apiUrl: string;
  clientSecret: string;
};

const { clientId, apiUrl, clientSecret } = process.env;

interface IClientId {
  user: string;
  organization: string;
  clientId: string;
}

export function getClientId(user: string, organization: string) : IClientId | null {
  const clientIds  = JSON.parse(process.env.clientIds || "[]") as IClientId[];
  return clientIds.find(c => c.user === user && c.organization === organization) || null;
}

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
