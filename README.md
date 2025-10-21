# Math Quiz with MCP Server

A demonstration application showing how an MCP (Model Context Protocol) server can act as a mathematical coprocessor. The LLM decides what calculations to perform, and the MCP server handles the computation using mathjs.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS - Simple math quiz interface
- **MCP Server**: Node.js + TypeScript - Mathematical evaluation service

## Project Structure

```
mcp-math/
├── frontend/           # React quiz application
│   ├── src/
│   │   ├── App.tsx    # Main quiz component
│   │   ├── main.tsx   # React entry point
│   │   └── index.css  # Tailwind styles
│   └── package.json
├── mcp-server/        # MCP server for math operations
│   ├── src/
│   │   └── index.ts   # MCP server implementation
│   └── package.json
└── package.json       # Workspace root
```

## Setup Instructions

### 1. Install Dependencies

From the root directory:

```bash
npm install
cd frontend && npm install
cd ../mcp-server && npm install
cd ..
```

Or use the convenience script:

```bash
npm run install:all
```

### 2. Build the MCP Server

```bash
cd mcp-server
npm run build
```

### 3. Configure MCP Client

#### For Cursor

Add the MCP server to your Cursor configuration file:

**Location**: `~/.cursor/mcp.json`

Example configuration:

```json
{
  "mcpServers": {
    "math": {
      "command": "node",
      "args": ["${HOME}/path/to/mcp-math/mcp-server/dist/index.js"]
    }
  }
}
```

**Important**: Replace `path/to/mcp-math` with the actual path from your home directory to your project directory. The `${HOME}` variable will be automatically expanded.

After updating the configuration, restart Cursor for the changes to take effect.

#### For Claude Desktop

Add the MCP server to your Claude Desktop configuration file:

**MacOS/Linux**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Example configuration:

```json
{
  "mcpServers": {
    "math": {
      "command": "node",
      "args": ["${HOME}/path/to/mcp-math/mcp-server/dist/index.js"]
    }
  }
}
```

**Important**: Replace `path/to/mcp-math` with the actual path from your home directory to your project directory.

After updating the configuration, restart Claude Desktop for the changes to take effect.

## Running the Application

### Start the Frontend

```bash
cd frontend
npm run dev
```

The quiz app will be available at `http://localhost:5173`

### Using the MCP Server with Claude/Cursor

Once configured, you can ask Claude (or Cursor AI) to use the math server:

**Example prompts:**

- "Use the math server to calculate 123 \* 456"
- "Evaluate sqrt(144) + sin(pi/2) using the evaluate tool"
- "What is (25 + 75) / (10 - 5)?"

The AI will automatically use the `evaluate` tool from the MCP server to perform calculations.

## MCP Server Tools

### `evaluate`

Evaluates a mathematical expression and returns the result.

**Input:**

- `expression` (string): Mathematical expression to evaluate

**Supported Operations:**

- Basic arithmetic: `+`, `-`, `*`, `/`
- Exponents: `^` or `**`
- Parentheses: `(`, `)`
- Common functions: `sqrt()`, `sin()`, `cos()`, `tan()`, `log()`, etc.
- Constants: `pi`, `e`

**Example:**

```json
{
  "expression": "2 * (3 + 4)"
}
```

**Response:**

```json
{
  "expression": "2 * (3 + 4)",
  "result": "14",
  "success": true
}
```

## Development

### Frontend Development

```bash
npm run dev:frontend
```

### MCP Server Development

After making changes to the MCP server:

```bash
cd mcp-server
npm run build
```

Then restart Claude Desktop to load the updated server.

### Build for Production

```bash
# Build frontend
npm run build:frontend

# Build MCP server
npm run build:mcp
```

## How It Works

### The MCP Pattern

This application demonstrates the "coprocessor" pattern:

1. **Frontend** displays math problems to users
2. **LLM** (Claude) understands user intent and decides what calculations to perform
3. **MCP Server** executes the calculations accurately using mathjs
4. **Result** flows back through Claude to the application

### Why Use MCP for Math?

- **Accuracy**: LLMs can struggle with precise calculations. The MCP server uses mathjs for exact results.
- **Separation of Concerns**: The LLM focuses on understanding and orchestration, while the MCP server handles computation.
- **Extensibility**: Easy to add new mathematical operations without retraining the model.

## Notes

- The current frontend implementation calculates answers locally for demo simplicity
- In a production setup, you would connect the frontend to Claude (via API or desktop app) which would use the MCP server
- This is a demonstration project showing MCP architecture - not production-ready

## Future Enhancements

Potential improvements:

- Add database for storing quiz results
- Connect frontend directly to Claude API with MCP
- Add more quiz types (algebra, geometry, etc.)
- Implement user authentication and progress tracking
- Add difficulty levels and adaptive quizzing

## Troubleshooting

### MCP Server not showing in Claude/Cursor

1. Check the configuration file path is correct (`~/.cursor/mcp.json` for Cursor)
2. Ensure the path to `index.js` is correct (use `${HOME}/...` for portability)
3. Verify the server builds without errors: `cd mcp-server && npm run build`
4. Check logs:
   - **Claude Desktop**: Help → Show Logs
   - **Cursor**: Check the MCP server output in Cursor settings
5. Restart Claude Desktop or Cursor after configuration changes

### Frontend not starting

1. Ensure dependencies are installed: `cd frontend && npm install`
2. Check Node.js version (requires Node 18+)
3. Try clearing node_modules and reinstalling

## License

MIT
