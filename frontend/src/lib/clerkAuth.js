let tokenGetter = null;

export function setClerkTokenGetter(getter) {
  tokenGetter = getter;
}

export function clearClerkTokenGetter() {
  tokenGetter = null;
}

export async function getClerkToken() {
  if (!tokenGetter) return null;
  return tokenGetter();
}
