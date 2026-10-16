// node broadcast_server.js   (env: OWNER_KEY = long random secret, PORT optional)
const http = require("http"), crypto = require("crypto");
const OWNER = "Kingbaconnon19", KEY = process.env.OWNER_KEY || "";
const h = s => crypto.createHash("sha256").update(String(s)).digest();
let msgs = [], lastId = 0, lastSend = 0;
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const out = (c, o) => { res.writeHead(c, { "Content-Type": "application/json" }); res.end(JSON.stringify(o)); };
  if (req.method === "GET" && u.pathname === "/poll") {
    const a = u.searchParams.get("after");
    return out(200, { id: lastId, msgs: a === null ? [] : msgs.filter(m => m.id > Number(a)) });
  }
  if (req.method === "POST" && u.pathname === "/send") {
    let b = "";
    req.on("data", d => { b += d; if (b.length > 4096) req.destroy(); });
    req.on("end", () => {
      let j; try { j = JSON.parse(b); } catch { return out(400, {}); }
      const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
      if (!KEY || !crypto.timingSafeEqual(h(tok), h(KEY)) || j.user !== OWNER) return out(403, {});
      const text = String(j.text || "").replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, 200);
      if (!text || Date.now() - lastSend < 2000) return out(400, {});
      lastSend = Date.now();
      lastId = Math.max(Date.now(), lastId + 1);
      msgs.push({ id: lastId, text });
      msgs = msgs.slice(-50);
      out(200, { id: lastId });
    });
    return;
  }
  out(404, {});
}).listen(process.env.PORT || 3000);
