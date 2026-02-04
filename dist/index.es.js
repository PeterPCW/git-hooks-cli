var f = Object.defineProperty;
var k = (r, e, s) => e in r ? f(r, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : r[e] = s;
var d = (r, e, s) => k(r, typeof e != "symbol" ? e + "" : e, s);
const P = [
  "applypatch-msg",
  "commit-msg",
  "fsmonitor-watchman",
  "post-applypatch",
  "post-checkout",
  "post-commit",
  "post-merge",
  "post-receive",
  "post-rewrite",
  "post-update",
  "pre-applypatch",
  "pre-auto-gc",
  "pre-checkout",
  "pre-commit",
  "pre-merge-commit",
  "pre-push",
  "pre-rebase",
  "pre-receive",
  "prepare-commit-msg",
  "push-to-checkout",
  "reference-transaction",
  "sendemail-validate",
  "shallow-clone",
  "update",
  "worktree-guid"
];
class v {
  constructor() {
    d(this, "hooks", /* @__PURE__ */ new Map());
    d(this, "parallel", !1);
    d(this, "ignorePatterns", []);
    d(this, "color", !1);
  }
  /**
   * Enable parallel execution
   */
  parallelExec(e = !0) {
    return this.parallel = e, this;
  }
  /**
   * Set ignore patterns
   */
  ignore(e) {
    return this.ignorePatterns = e, this;
  }
  /**
   * Enable colored output
   */
  useColors(e = !0) {
    return this.color = e, this;
  }
  /**
   * Register a hook
   */
  register(e) {
    return this.hooks.set(e.name, e), this;
  }
  /**
   * Unregister a hook
   */
  unregister(e) {
    return this.hooks.delete(e), this;
  }
  /**
   * Get registered hook
   */
  get(e) {
    return this.hooks.get(e);
  }
  /**
   * List all registered hooks
   */
  list() {
    return Array.from(this.hooks.values());
  }
  /**
   * Check if files match ignore patterns
   */
  shouldIgnore(e) {
    return this.ignorePatterns.length === 0 ? !1 : e.some(
      (s) => this.ignorePatterns.some((t) => this.matchIgnorePattern(s, t))
    );
  }
  /**
   * Match a file against an ignore pattern
   */
  matchIgnorePattern(e, s) {
    if (s.endsWith("/")) {
      const t = s.slice(0, -1);
      return e.startsWith(s) || e.includes("/" + t + "/") || e.endsWith("/" + t);
    }
    if (s.includes("*")) {
      const t = s.replace(/\./g, "\\.").replace(/\*\*/g, "§§§").replace(/\*/g, "[^/]*").replace(/§§§/g, ".*");
      return new RegExp(`^${t}$`).test(e);
    }
    return e === s || e.endsWith("/" + s) || e.includes("/" + s + "/");
  }
  /**
   * Run a single command
   */
  async runCommand(e, s = []) {
    try {
      const { spawn: t } = await import("child_process"), o = process.platform === "win32", l = o || e.includes("&&") || e.includes("||"), c = l ? o ? ["/c", e, ...s] : ["-c", e, ...s] : s, i = l ? o ? "cmd.exe" : "/bin/sh" : e;
      return new Promise((p) => {
        var h, a, g;
        const n = t(i, c, {
          stdio: "pipe",
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: this.color ? "1" : void 0 }
        });
        let m = "", w = "";
        (h = n.stdout) == null || h.on("data", (u) => {
          m += u, process.stdout.write(u);
        }), (a = n.stderr) == null || a.on("data", (u) => {
          w += u, process.stderr.write(u);
        }), n.on("close", (u) => {
          p(u === 0);
        }), n.on("error", () => {
          p(!1);
        }), (g = n.stdin) == null || g.end();
      });
    } catch {
      return !1;
    }
  }
  /**
   * Run a hook
   */
  async run(e, s = []) {
    const t = this.hooks.get(e);
    if (!t)
      return !1;
    if (this.shouldIgnore(s) || t.condition && !t.condition(s))
      return !0;
    const o = t.command.split("&&").map((c) => c.trim());
    if ((t.parallel ?? this.parallel) && o.length > 1)
      return (await Promise.all(
        o.map((i) => this.runCommand(i, t.args))
      )).every((i) => i);
    for (const c of o)
      if (!await this.runCommand(c, t.args))
        return !1;
    return !0;
  }
  /**
   * Run all hooks
   */
  async runAll(e = []) {
    let s = !0;
    for (const t of this.hooks.values())
      await this.run(t.name, e) || (s = !1);
    return s;
  }
  /**
   * Clear all hooks
   */
  clear() {
    return this.hooks.clear(), this;
  }
  /**
   * Get hook count
   */
  count() {
    return this.hooks.size;
  }
}
function C() {
  return new v();
}
function x(r) {
  return r;
}
async function W(r, e = [], s = {}) {
  const { spawn: t } = await import("child_process"), o = process.platform === "win32", l = o || r.includes("&&") || r.includes("||"), c = l ? o ? ["/c", r, ...e] : ["-c", r, ...e] : e, i = l ? o ? "cmd.exe" : "/bin/sh" : r;
  return new Promise((p) => {
    var m, w, h;
    const n = t(i, c, {
      stdio: "pipe",
      cwd: s.cwd || process.cwd(),
      env: { ...process.env, ...s.env }
    });
    (m = n.stdout) == null || m.on("data", (a) => process.stdout.write(a)), (w = n.stderr) == null || w.on("data", (a) => process.stderr.write(a)), n.on("close", (a) => {
      p(a === 0);
    }), n.on("error", () => {
      p(!1);
    }), (h = n.stdin) == null || h.end();
  });
}
function I() {
  return P;
}
export {
  P as GIT_HOOKS,
  v as HookRunner,
  C as createHookRunner,
  x as defineConfig,
  I as getSupportedHooks,
  W as spawnCommand
};
