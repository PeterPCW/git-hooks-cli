var g = Object.defineProperty;
var w = (t, e, o) => e in t ? g(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var h = (t, e, o) => w(t, typeof e != "symbol" ? e + "" : e, o);
const v = [
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
class f {
  constructor() {
    h(this, "hooks", /* @__PURE__ */ new Map());
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
   * Run a hook
   */
  async run(e, o = []) {
    const n = this.hooks.get(e);
    if (!n)
      return !1;
    const u = n.command, m = [...n.args || [], ...o];
    try {
      const { spawn: d } = await import("child_process");
      return new Promise((c) => {
        var p, i, a;
        const s = d(u, m, {
          stdio: "pipe",
          cwd: process.cwd(),
          env: { ...process.env }
        });
        let l = "", k = "";
        (p = s.stdout) == null || p.on("data", (r) => {
          l += r, process.stdout.write(r);
        }), (i = s.stderr) == null || i.on("data", (r) => {
          k += r, process.stderr.write(r);
        }), s.on("close", (r) => {
          c(r === 0);
        }), s.on("error", () => {
          c(!1);
        }), (a = s.stdin) == null || a.end();
      });
    } catch {
      return !1;
    }
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
function H() {
  return new f();
}
function A(t) {
  return t;
}
export {
  v as GIT_HOOKS,
  f as HookRunner,
  H as createHookRunner,
  A as defineConfig
};
