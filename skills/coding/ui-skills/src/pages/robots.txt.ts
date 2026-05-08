import type { APIRoute } from "astro";

const SITE_URL = "https://www.ui-skills.com";

export const GET: APIRoute = ({ site }) => {
  const origin = site?.origin ?? SITE_URL;
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
