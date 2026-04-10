module.exports = {
  apps: [
    {
      name: "curreex-server",
      cwd: "/home/curreex/htdocs/curreex.com/server",
      script: "dist/server.js",
      interpreter: "node",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "curreex-client",
      cwd: "/home/curreex/htdocs/curreex.com/client",
      script: "npm",
      args: "start -- --port 3001",
      interpreter: "none",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
