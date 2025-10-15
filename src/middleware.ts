// Middleware for handling admin authentication
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Check if the request is for an admin page
  if (pathname.startsWith("/admin")) {
    const authHeader = context.request.headers.get("authorization");

    // Expected credentials: username "thomas", password "7Falklands"
    const expectedAuth = "Basic " + btoa("thomas:7Falklands");

    if (authHeader !== expectedAuth) {
      // Return 401 Unauthorized with WWW-Authenticate header
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"',
        },
      });
    }
  }

  // Continue to the next middleware or page
  return next();
});
