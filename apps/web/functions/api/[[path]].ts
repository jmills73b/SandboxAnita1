// Makes the API same-origin from the browser's point of view. Without this,
// the frontend (pages.dev) and API (workers.dev) are genuinely cross-site,
// and Safari's cross-site tracking prevention can silently drop the session
// cookie on some requests while allowing others -- which is exactly the bug
// this fixes: signed in per /api/me, then "Not signed in" moments later on
// /api/invoices, with no code difference between the two calls.
//
// Every request to <this-site>/api/* is forwarded here, unchanged, to the
// real Worker -- and because the browser only ever talks to this domain,
// the session cookie is first-party the whole way through.

const API_ORIGIN = "https://anita-invoice-tracker-api.jmills1983-1aa.workers.dev";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const target = new URL(url.pathname + url.search, API_ORIGIN);
  const proxied = new Request(target, context.request);
  return fetch(proxied);
};
