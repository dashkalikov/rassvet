import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import {recordRequest} from '../lib/operations';

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const path=new URL(request.url).pathname;
    const database=env.DB;
    const measure=/^\/api\/(auth|orders|profile|tickets|account|orbits)(\/|$)/.test(path);
    const started=performance.now();
    let status=500;
    try {
      const response=await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
      status=response.status;
      return response;
    } finally {
      if(measure&&database)ctx.waitUntil(recordRequest(drizzle(database,{schema}),status,performance.now()-started).catch(()=>{}));
    }
  },
};

export default worker;
