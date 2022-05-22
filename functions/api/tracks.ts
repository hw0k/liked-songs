type Context = EventContext<{[key: string]: string}, any, Record<string, unknown>>;

// Checkout!
// https://open.spotify.com/playlist/0XpKVV40B4OAuAgqmXa4lm/
const PLAYLIST_ID = "0XpKVV40B4OAuAgqmXa4lm";

function makeErrorResponse(status: number) {
  return new Response(null, { status });
}

function makeSuccessfulJsonResponse<T extends Record<string, any>>(body: T) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");

  return new Response(JSON.stringify(body, undefined, 2), { headers });
}

async function getAccessToken({ clientId, clientSecret }: { clientId: string, clientSecret: string }) {
  const requestHeaders = new Headers();
  requestHeaders.append("Authorization", `Basic ${btoa(`${clientId}:${clientSecret}`)}`);
  requestHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: requestHeaders,
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!response.ok) {
    throw new Error();
  }

  const json = await response.json();

  return (json as Record<string, any>).access_token;
}

async function getPlaylistTracks({ token, limit = 50, offset = 0 }: { token: string, limit?: number, offset?: number }) {
  const params = new URLSearchParams();
  params.append("fields", "total,offset,items(track(name,artists,album(images)))");
  params.append("market", "KR");
  params.append("limit", limit.toString());
  params.append("offset", offset.toString());

  const headers = new Headers();
  headers.append("Authorization", `Bearer ${token}`);
  headers.append("Content-Type", "application/json");
  headers.append("Accept", "application/json");

  console.log(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?${params.toString()}`);

  const response = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?${params.toString()}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    throw new Error();
  }

  const json = await response.json();

  return json as Record<string, any>;
}

export async function onRequest({ request, env }: Context) {
  if (request.method !== 'GET') {
    return makeErrorResponse(405);
  }

  const token = await getAccessToken({
    clientId: env.SPOTIFY_APP_CLIENT_ID,
    clientSecret: env.SPOTIFY_APP_CLIENT_SECRET,
  });

  const tracks = await getPlaylistTracks({
    token,
  });

  return makeSuccessfulJsonResponse(tracks);
}
