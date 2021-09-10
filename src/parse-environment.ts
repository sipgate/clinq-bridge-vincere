export type EnvConfig = {
  redirectUrl: string;
};

const { redirectUrl } = process.env;

export default function parseEnvironment(): EnvConfig {
  if (!redirectUrl) {
    throw new Error("Missing clientId in environment.");
  }
  return {
    redirectUrl
  };
}
