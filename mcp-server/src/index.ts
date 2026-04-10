#!/usr/bin/env node

import * as Sentry from "@sentry/node";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { evaluate, parse } from "mathjs";
import type { MathNode } from "mathjs";
import { z } from "zod";

// Initialize Sentry - must be above everything else
Sentry.init({
  dsn: "https://2b1607db500835045457f4e5ca61de65@o4509013641854976.ingest.us.sentry.io/4510225201954816",
  tracesSampleRate: 1.0,
  enableLogs: true,
  environment: "mcp-server",
  // Optional: Enable to capture tool call arguments and results, which may include PII
  sendDefaultPii: true,
  integrations: [
    Sentry.consoleIntegration({ levels: ["log", "info", "error", "warn"] }),
  ],
  debug: true,
});

// Detect which client is running the server
const clientName = process.env.MCP_CLIENT_NAME || "unknown";

// Set global MCP client tag - this will be used if the client doesn't send clientInfo
Sentry.setTag("mcp.client.name", clientName);
Sentry.setContext("mcp_environment", {
  host: clientName,
  runtime: "node",
});

// === SECURITY: Blocklist for dangerous identifiers ===
const BLOCKED_IDENTIFIERS = [
  "exec", "system", "spawn", "eval", "Function",
  "require", "import", "process", "env", "__proto__",
  "constructor", "prototype",
];
const BLOCKED_PATTERN = new RegExp(
  `\\b(${BLOCKED_IDENTIFIERS.join("|")})\\b`,
  "i"
);

function validateExpression(expression: string): void {
  // Quick regex pre-check before AST parsing
  if (BLOCKED_PATTERN.test(expression)) {
    throw new Error(`Expression contains disallowed identifier`);
  }

  // AST-level check: walk the parse tree and block dangerous nodes
  const ast = parse(expression);
  ast.traverse((node: MathNode) => {
    if (
      node.type === "FunctionNode" &&
      BLOCKED_IDENTIFIERS.includes((node as any).name)
    ) {
      throw new Error(`Function '${(node as any).name}' is not allowed`);
    }
    if (node.type === "AccessNode") {
      throw new Error(`Property access is not allowed in expressions`);
    }
  });
}

// Create server instance and wrap with Sentry
const server = Sentry.wrapMcpServerWithSentry(
  new McpServer(
    {
      name: "mcp-math-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )
);

// Register the evaluate tool using the new MCP SDK API
server.tool(
  "evaluate",
  "Evaluates a mathematical expression and returns the result. " +
    "Supports basic arithmetic (+, -, *, /), exponents (^), parentheses, " +
    "and common math functions. Examples: '2 + 2', '3 * (4 + 5)', 'sqrt(16)', 'sin(pi/2)'",
  {
    expression: z.string().describe("The mathematical expression to evaluate"),
  },
  async ({ expression }) => {
    // Add MCP context to Sentry scope
    Sentry.setContext("mcp", {
      tool: "evaluate",
      server: "mcp-math-server",
    });

    try {
      // Validate and parse the expression (security check + parse in one step)
      const parseResult = await Sentry.startSpan(
        {
          op: "math.parse",
          name: "Parse Expression",
          attributes: {
            expression,
          },
        },
        async () => {
          validateExpression(expression); // 🔒 Security validation
          return parse(expression);
        }
      );

      // Evaluate the expression
      const result = await Sentry.startSpan(
        {
          op: "math.evaluate",
          name: "Evaluate Expression",
          attributes: {
            expression,
          },
        },
        async () => {
          return evaluate(expression);
        }
      );

      // Log successful evaluation with MCP context
      const { logger } = Sentry;
      logger.info("Math expression evaluated successfully", {
        expression,
        result: String(result),
        "mcp.tool": "evaluate",
        "mcp.server": "mcp-math-server",
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                expression,
                result: String(result),
                success: true,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Capture the error in Sentry with security flag if it was a blocked attempt
      const isSecurityViolation =
        errorMessage.includes("disallowed identifier") ||
        errorMessage.includes("is not allowed") ||
        errorMessage.includes("Property access is not allowed");

      Sentry.captureException(error, {
        level: isSecurityViolation ? "warning" : "error",
        tags: {
          "mcp.tool": "evaluate",
          "mcp.expression": expression,
          "security.violation": String(isSecurityViolation),
        },
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                expression,
                error: isSecurityViolation
                  ? "Invalid expression: only mathematical expressions are allowed"
                  : errorMessage,
                success: false,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Math Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  Sentry.captureException(error, {
    level: "fatal",
  });
  // Flush Sentry before exiting
  Sentry.close(2000).then(() => {
    process.exit(1);
  });
});