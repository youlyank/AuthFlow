import { generateKeyPairSync } from "crypto";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const KEYS_DIR = join(process.cwd(), ".keys");
const PRIVATE_KEY_PATH = join(KEYS_DIR, "private.pem");
const PUBLIC_KEY_PATH = join(KEYS_DIR, "public.pem");

export interface RSAKeys {
  privateKey: string;
  publicKey: string;
  kid: string; // Key ID for JWKS
}

export function generateRSAKeyPair(): RSAKeys {
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 4096, // Enterprise-grade 4096-bit keys
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  // Generate a key ID (kid) for JWKS
  const kid = `authflow-${Date.now()}`;

  return { privateKey, publicKey, kid };
}

export function saveRSAKeys(keys: RSAKeys): void {
  // Ensure .keys directory exists
  if (!existsSync(KEYS_DIR)) {
    mkdirSync(KEYS_DIR, { recursive: true });
  }

  // Save keys to files
  writeFileSync(PRIVATE_KEY_PATH, keys.privateKey, { mode: 0o600 }); // Restricted permissions
  writeFileSync(PUBLIC_KEY_PATH, keys.publicKey);
  writeFileSync(join(KEYS_DIR, "kid.txt"), keys.kid);

  console.log("✅ RSA keys generated and saved to .keys/ directory");
}

export function loadRSAKeys(): RSAKeys | null {
  try {
    if (!existsSync(PRIVATE_KEY_PATH) || !existsSync(PUBLIC_KEY_PATH)) {
      return null;
    }

    const privateKey = readFileSync(PRIVATE_KEY_PATH, "utf-8");
    const publicKey = readFileSync(PUBLIC_KEY_PATH, "utf-8");
    const kid = existsSync(join(KEYS_DIR, "kid.txt"))
      ? readFileSync(join(KEYS_DIR, "kid.txt"), "utf-8")
      : `authflow-${Date.now()}`;

    return { privateKey, publicKey, kid };
  } catch (error) {
    console.error("Error loading RSA keys:", error);
    return null;
  }
}

export function getOrCreateRSAKeys(): RSAKeys {
  // Try to load existing keys
  let keys = loadRSAKeys();

  // If no keys exist, generate new ones
  if (!keys) {
    console.log("🔑 No RSA keys found. Generating new key pair...");
    keys = generateRSAKeyPair();
    saveRSAKeys(keys);
  } else {
    console.log("🔑 Loaded existing RSA keys");
  }

  return keys;
}

// Initialize RSA keys on module load
export const rsaKeys = getOrCreateRSAKeys();

// Export public key in JWK format for JWKS endpoint
export function getJWKS() {
  const publicKeyObject = require("crypto").createPublicKey(rsaKeys.publicKey);
  const jwk = publicKeyObject.export({ format: "jwk" });

  return {
    keys: [
      {
        ...jwk,
        kid: rsaKeys.kid,
        use: "sig", // Signature use
        alg: "RS256", // Algorithm
        kty: "RSA", // Key type
      },
    ],
  };
}
