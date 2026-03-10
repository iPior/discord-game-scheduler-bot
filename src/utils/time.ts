export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function nowIso(): string {
  return new Date().toISOString();
}
