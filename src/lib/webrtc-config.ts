/**
 * Configuration WebRTC ICE Servers (STUN & TURN).
 * Assure la traversée des NAT/pare-feu pour la 4G/5G, Wi-Fi stricts et connexions mobiles.
 */

export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.services.mozilla.com" },
];

/**
 * Récupère la liste complète des serveurs STUN et TURN.
 * Supporte des serveurs TURN personnalisés configurés via variables d'environnement.
 */
export function getIceServers(): RTCIceServer[] {
  const customJson = process.env.NEXT_PUBLIC_ICE_SERVERS_JSON;
  if (customJson) {
    try {
      const parsed = JSON.parse(customJson) as RTCIceServer[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...parsed, ...DEFAULT_ICE_SERVERS];
      }
    } catch {
      // Ignore JSON parse error and fallback
    }
  }

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl) {
    const customTurn: RTCIceServer = {
      urls: turnUrl,
      ...(turnUsername ? { username: turnUsername } : {}),
      ...(turnCredential ? { credential: turnCredential } : {}),
    };
    return [customTurn, ...DEFAULT_ICE_SERVERS];
  }

  return DEFAULT_ICE_SERVERS;
}
