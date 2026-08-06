import { Hono } from "hono";
import type { AppEnv } from "../index";
import { requireAuth } from "./auth";

const usage = new Hono<AppEnv>();

usage.use("*", requireAuth);

// The whole point of this page is a warning before hitting a Cloudflare
// free-tier wall — these are their published Workers/D1 free-plan caps,
// not something to look up live. Free limits reset daily at 00:00 UTC.
const CAPS = {
  workersRequests: 100_000,
  d1RowsRead: 5_000_000,
  d1RowsWritten: 100_000,
  d1StorageBytes: 5_000_000_000,
};

// The same database this Worker already talks to via the DB binding —
// wrangler.toml's database_id, needed here because the D1 REST API (for
// storage size) addresses a database by id, not by binding name.
const D1_DATABASE_ID = "d852a373-d2e7-496f-b08f-2ba20d588189";

interface GraphQLResponse {
  data?: {
    viewer?: {
      accounts?: Array<{
        workers?: Array<{ sum: { requests: number } }>;
        d1?: Array<{ sum: { rowsRead: number; rowsWritten: number } }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
}

function startOfTodayUTC(): string {
  return `${new Date().toISOString().slice(0, 10)}T00:00:00Z`;
}

usage.get("/", async (c) => {
  const token = c.env.CF_API_TOKEN;
  const accountId = c.env.CF_ACCOUNT_ID;

  if (!token || !accountId) {
    return c.json(
      { error: "Usage tracking isn't set up yet — CF_API_TOKEN and CF_ACCOUNT_ID need to be configured." },
      501,
    );
  }

  const since = startOfTodayUTC();
  const now = new Date().toISOString();

  // Both Workers requests and D1 rows-read/written come from the same
  // GraphQL Analytics API in one round trip; D1 storage is a separate REST
  // call below since it's a current snapshot, not a metered daily count.
  const graphqlRes = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query UsageToday($accountTag: string, $since: string, $until: string) {
          viewer {
            accounts(filter: { accountTag: $accountTag }) {
              workers: workersInvocationsAdaptiveGroups(
                filter: { datetime_geq: $since, datetime_lt: $until }
                limit: 1
              ) {
                sum { requests }
              }
              d1: d1AnalyticsAdaptiveGroups(
                filter: { datetime_geq: $since, datetime_lt: $until }
                limit: 1
              ) {
                sum { rowsRead rowsWritten }
              }
            }
          }
        }
      `,
      variables: { accountTag: accountId, since, until: now },
    }),
  });

  if (!graphqlRes.ok) {
    return c.json({ error: `Cloudflare's analytics API returned an error (${graphqlRes.status})` }, 502);
  }

  const graphqlBody = await graphqlRes.json<GraphQLResponse>();
  if (graphqlBody.errors?.length) {
    return c.json(
      { error: `Cloudflare's analytics API: ${graphqlBody.errors[0].message} — check the token has Account Analytics: Read.` },
      502,
    );
  }

  const account = graphqlBody.data?.viewer?.accounts?.[0];
  const requestsToday = account?.workers?.[0]?.sum.requests ?? 0;
  const d1RowsReadToday = account?.d1?.[0]?.sum.rowsRead ?? 0;
  const d1RowsWrittenToday = account?.d1?.[0]?.sum.rowsWritten ?? 0;

  const storageRes = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${D1_DATABASE_ID}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  let d1StorageBytes = 0;
  if (storageRes.ok) {
    const storageBody = await storageRes.json<{ result?: { file_size?: number } }>();
    d1StorageBytes = storageBody.result?.file_size ?? 0;
  }

  return c.json({
    workersRequests: { used: requestsToday, cap: CAPS.workersRequests },
    d1RowsRead: { used: d1RowsReadToday, cap: CAPS.d1RowsRead },
    d1RowsWritten: { used: d1RowsWrittenToday, cap: CAPS.d1RowsWritten },
    d1Storage: { used: d1StorageBytes, cap: CAPS.d1StorageBytes },
  });
});

export default usage;
