export function base64urlToBase64(b64url: string): string {
	return b64url.replace(/-/g, "+").replace(/_/g, "/");
}