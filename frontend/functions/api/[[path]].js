const BACKEND = "https://fastonelabs-api.onrender.com";

export async function onRequest({ request }) {
  const incoming = new URL(request.url);

  const upstream = new URL(
    incoming.pathname + incoming.search,
    BACKEND
  );

  try {
    return await fetch(
      new Request(upstream.toString(), request)
    );
  } catch (error) {
    console.error("API proxy failed", error);

    return Response.json(
      { detail: "Backend temporarily unavailable" },
      { status: 502 }
    );
  }
}
