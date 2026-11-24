"use client";
import { useMemo, useState } from "react";

type Auth = "windows" | "sql" | "entra";

// Values containing ; or = or leading/trailing spaces must be quoted in ADO.NET connection strings.
const q = (v: string) => /[;="']|^\s|\s$/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export default function ConnStringTool() {
  const [server, setServer] = useState("localhost\\SQLEXPRESS");
  const [database, setDatabase] = useState("Shop");
  const [auth, setAuth] = useState<Auth>("windows");
  const [user, setUser] = useState("shop_app");
  const [password, setPassword] = useState("");
  const [encrypt, setEncrypt] = useState(true);
  const [trust, setTrust] = useState(true);
  const [mars, setMars] = useState(false);
  const [timeout, setTimeoutS] = useState("30");
  const [appName, setAppName] = useState("");

  const cs = useMemo(() => {
    const p: string[] = [`Server=${q(server.trim())}`];
    if (database.trim()) p.push(`Database=${q(database.trim())}`);
    if (auth === "windows") p.push("Trusted_Connection=True");
    if (auth === "sql") p.push(`User Id=${q(user)}`, `Password=${q(password || "<your-password>")}`);
    if (auth === "entra") p.push("Authentication=Active Directory Default");
    p.push(`Encrypt=${encrypt ? "True" : "False"}`);
    if (encrypt && trust) p.push("TrustServerCertificate=True");
    if (mars) p.push("MultipleActiveResultSets=True");
    if (timeout.trim() && timeout.trim() !== "15") p.push(`Connect Timeout=${Number(timeout) || 15}`);
    if (appName.trim()) p.push(`Application Name=${q(appName.trim())}`);
    return p.join(";") + ";";
  }, [server, database, auth, user, password, encrypt, trust, mars, timeout, appName]);

  const json = `"ConnectionStrings": {\n  "Default": ${JSON.stringify(cs)}\n}`;
  const copy = (s: string) => navigator.clipboard.writeText(s);

  return (
    <div className="tool">
      <div className="tool-cols">
        <label className="tool-label">Server<input className="tool-input mono" value={server} onChange={(e) => setServer(e.target.value)} placeholder="localhost, .\SQLEXPRESS, myserver.database.windows.net,1433" /></label>
        <label className="tool-label">Database<input className="tool-input mono" value={database} onChange={(e) => setDatabase(e.target.value)} /></label>
      </div>
      <div className="row tool-actions">
        <span className="tool-label">Login</span>
        <label className="check"><input type="radio" name="auth" checked={auth === "windows"} onChange={() => setAuth("windows")} /> Windows (Integrated)</label>
        <label className="check"><input type="radio" name="auth" checked={auth === "sql"} onChange={() => setAuth("sql")} /> SQL Server login</label>
        <label className="check"><input type="radio" name="auth" checked={auth === "entra"} onChange={() => setAuth("entra")} /> Microsoft Entra (Azure SQL)</label>
      </div>
      {auth === "sql" && (
        <div className="tool-cols">
          <label className="tool-label">User Id<input className="tool-input mono" value={user} onChange={(e) => setUser(e.target.value)} /></label>
          <label className="tool-label">Password<input className="tool-input mono" type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="stays in your browser" /></label>
        </div>
      )}
      <div className="row tool-actions">
        <label className="check"><input type="checkbox" checked={encrypt} onChange={(e) => setEncrypt(e.target.checked)} /> Encrypt</label>
        <label className="check"><input type="checkbox" checked={trust} disabled={!encrypt} onChange={(e) => setTrust(e.target.checked)} /> TrustServerCertificate (local / self-signed)</label>
        <label className="check"><input type="checkbox" checked={mars} onChange={(e) => setMars(e.target.checked)} /> MultipleActiveResultSets</label>
        <label className="check">Connect timeout (s) <input className="tool-input" style={{ width: "5em" }} value={timeout} onChange={(e) => setTimeoutS(e.target.value)} /></label>
        <label className="check">Application Name <input className="tool-input" style={{ width: "10em" }} value={appName} onChange={(e) => setAppName(e.target.value)} /></label>
      </div>
      <div className="row"><span className="tool-label">Connection string</span><span className="spacer" />
        <button className="btn small" onClick={() => copy(cs)}>Copy</button></div>
      <pre className="tool-pre">{cs}</pre>
      <div className="row"><span className="tool-label">appsettings.json</span><span className="spacer" />
        <button className="btn small" onClick={() => copy(json)}>Copy</button></div>
      <pre className="tool-pre">{json}</pre>
    </div>
  );
}
