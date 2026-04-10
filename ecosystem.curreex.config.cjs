module.exports = {
  apps: [
    {
      name: "curreex-server",
      cwd: "/home/curreex/htdocs/curreex.com/server",
      script: "dist/server.js",
      interpreter: "node",
      instances: "max",
      exec_mode: "cluster",
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
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
