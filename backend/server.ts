import express from "express";
import path from "path";
import { spawn, exec, ChildProcessWithoutNullStreams } from "child_process";
import fs from "fs";
import { fileURLToPath } from "url";
import authRouter from "./server-auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

app.use(express.json());

// Mount the Auth Router for signup, login, and profile update
app.use("/api/auth", authRouter);

// Helper to execute the python script in API mode and return the parsed JSON
function runPythonAPI(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    // Run python3 social_graph.py --api <args>
    const pythonProcess = spawn("python3", ["social_graph.py", "--api", ...args]);
    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}. Stderr: ${stderr}`));
        return;
      }
      try {
        const response = JSON.parse(stdout.trim());
        resolve(response);
      } catch (err) {
        reject(new Error(`Failed to parse Python stdout as JSON: ${stdout}. Error: ${err}`));
      }
    });
  });
}

// ==========================================
//              API ROUTES
// ==========================================

// Get current graph data (nodes and adjacency list)
app.get("/api/graph", async (req, res) => {
  try {
    const data = await runPythonAPI(["get_graph"]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a user node
app.post("/api/user", async (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ success: false, message: "Username is required." });
    return;
  }
  try {
    const data = await runPythonAPI(["add_user", username]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add a friendship edge (bidirectional)
app.post("/api/friendship", async (req, res) => {
  const { user1, user2 } = req.body;
  if (!user1 || !user2) {
    res.status(400).json({ success: false, message: "Both usernames are required." });
    return;
  }
  try {
    const data = await runPythonAPI(["add_friendship", user1, user2]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a user node and all their friendships
app.delete("/api/user", async (req, res) => {
  const username = req.body.username || req.query.username;
  if (!username) {
    res.status(400).json({ success: false, message: "Username is required." });
    return;
  }
  try {
    const data = await runPythonAPI(["delete_user", username as string]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a friendship edge (bidirectional)
app.delete("/api/friendship", async (req, res) => {
  const user1 = req.body.user1 || req.query.user1;
  const user2 = req.body.user2 || req.query.user2;
  if (!user1 || !user2) {
    res.status(400).json({ success: false, message: "Both usernames are required." });
    return;
  }
  try {
    const data = await runPythonAPI(["delete_friendship", user1 as string, user2 as string]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run BFS Shortest Path
app.get("/api/bfs", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) {
    res.status(400).json({ success: false, message: "Start and End users are required." });
    return;
  }
  try {
    const data = await runPythonAPI(["bfs", start as string, end as string]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run DFS Community Detection
app.get("/api/dfs", async (req, res) => {
  try {
    const data = await runPythonAPI(["dfs"]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run Degree Centrality Ranker
app.get("/api/centrality", async (req, res) => {
  try {
    const data = await runPythonAPI(["centrality"]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Run Mutual Friends Finding (Set Intersection)
app.get("/api/mutual", async (req, res) => {
  const { user1, user2 } = req.query;
  if (!user1 || !user2) {
    res.status(400).json({ success: false, message: "Both usernames are required." });
    return;
  }
  try {
    const data = await runPythonAPI(["mutual", user1 as string, user2 as string]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset the entire graph
app.post("/api/reset", async (req, res) => {
  try {
    const data = await runPythonAPI(["reset"]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Load the default demo network preset
app.post("/api/load_preset", async (req, res) => {
  try {
    const data = await runPythonAPI(["load_preset"]);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// ==========================================
//          TERMINAL SESSION HANDLER
// ==========================================
let activeProcess: ChildProcessWithoutNullStreams | null = null;
let outputBuffer = "";

// Initialize or restart terminal process
function startTerminalProcess(): Promise<string> {
  return new Promise((resolve) => {
    if (activeProcess) {
      try {
        activeProcess.kill();
      } catch (e) {}
    }

    activeProcess = spawn("python3", ["social_graph.py"]);
    outputBuffer = "";

    activeProcess.stdout.on("data", (data) => {
      outputBuffer += data.toString();
    });

    activeProcess.stderr.on("data", (data) => {
      outputBuffer += data.toString();
    });

    activeProcess.on("close", (code) => {
      outputBuffer += `\n[Python CLI session ended. Exit code: ${code}]\n`;
      activeProcess = null;
    });

    // Give it a tiny moment to spin up and produce the initial menu output
    setTimeout(() => {
      resolve(outputBuffer);
      outputBuffer = ""; // clear after sending initial batch
    }, 150);
  });
}

// Start terminal process
app.post("/api/terminal/start", async (req, res) => {
  const initialOutput = await startTerminalProcess();
  res.json({ output: initialOutput });
});

// Send input to the CLI terminal
app.post("/api/terminal/input", (req, res) => {
  const { input } = req.body;
  if (activeProcess === null) {
    res.json({ output: "\n[Error: CLI terminal is not running. Please restart the session.]\n" });
    return;
  }

  // Clear previous output buffer before writing
  outputBuffer = "";
  
  // Write input to standard input of the python script
  activeProcess.stdin.write(input + "\n");

  // Wait a small duration for Python to process and print response
  setTimeout(() => {
    res.json({ output: outputBuffer });
    outputBuffer = ""; // flush
  }, 150);
});

// Reset terminal
app.post("/api/terminal/reset", async (req, res) => {
  const initialOutput = await startTerminalProcess();
  res.json({ output: initialOutput });
});


// ==========================================
//             STATIC FILE SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    // Serve production static assets
    const distPath = path.join(__dirname, "../frontend/dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    // In dev mode, return a simple status message for root visits
    app.get("/", (req, res) => {
      res.send("API Server is running in Development Mode. Connect via Frontend Vite Server.");
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
