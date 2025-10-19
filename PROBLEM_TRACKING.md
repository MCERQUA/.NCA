# Problem Tracking Log

**Purpose**: Track recurring issues and attempted fixes to avoid repeating the same mistakes.

**Rule**: If a problem repeats >5 times, add a permanent rule to CLAUDE.md.

---

## 🔴 ACTIVE ISSUE #1: Signup Form API 404 Errors

**Issue ID**: `SIGNUP-API-404`
**Status**: ACTIVE - Not Resolved
**Started**: 2025-10-19
**Symptom**: Signup form returns "Error Creating Profile" with 404 on `/api/upload-image` and `/api/contractors`

### Attempt Log

#### Attempt #1 - 2025-10-19 16:07
- **Action**: Added `export const prerender = true;` to contractor profile pages `[location]/[category]/[slug].astro`
- **Result**: ✅ Fixed 404 on contractor profile pages (different issue)
- **Impact on signup**: ❌ No change - signup still broken
- **Commit**: `3a001ac`

#### Attempt #2 - 2025-10-19 16:44
- **Action**: Changed signup page from `prerender: true` to `prerender: false`
- **Reasoning**: "API routes need server-side rendering"
- **Result**: ❌ Created NEW problem - signup page itself returns 404
- **Root Cause**: Toggling prerender doesn't fix routing issues
- **Commit**: `891f938`
- **Rollback**: ✅ Reverted in commit `bc52a06`

### Investigation Findings

#### Build Analysis (2025-10-19 16:52)
✅ **API routes ARE being built correctly:**
```javascript
// .netlify/build/entry.mjs
const _page1 = () => import('./pages/api/contractors.astro.mjs');
const _page3 = () => import('./pages/api/upload-image.astro.mjs');
```

✅ **API route files exist:**
- `apps/web/.netlify/build/pages/api/contractors.astro.mjs` - EXISTS
- `apps/web/.netlify/build/pages/api/upload-image.astro.mjs` - EXISTS
- Both have `export const prerender = false`
- Both have proper `POST` handlers

✅ **Local build is successful:**
- No errors in build output
- All routes compile correctly
- SSR function bundle created

### Current Hypothesis

**The code is correct. This is a Netlify deployment issue, not a code issue.**

Possible causes:
1. Netlify SSR function not routing `/api/*` requests correctly
2. Environment variables missing in Netlify (blocking API execution)
3. Netlify's CDN caching 404 responses
4. Base directory mismatch in netlify.toml vs deployment

### Deployment Log Analysis #1 (2025-10-19 12:52 PM)

**Build Output:**
```
✅ Build successful: "16:53:39 [build] Complete!"
✅ SSR Function generated: "16:53:39 [@astrojs/netlify] Generated SSR Function"
✅ Signup page prerendered: "/signup/index.html"
⚠️ Deploy shows: "0 new file(s) to upload" and "0 new function(s) to upload"
```

**Finding:** Netlify using cached SSR function.

### Deployment Log Analysis #2 (2025-10-19 12:59 PM) - AFTER CACHE CLEAR

**Build Output:**
```
✅ Building without cache: "12:59:07 PM: Building without cache"
✅ Fresh clone: "12:59:07 PM: No cached dependencies found. Cloning fresh repo"
✅ Build successful: "17:00:31 [build] Complete!"
✅ SSR Function generated: "17:00:31 [@astrojs/netlify] Generated SSR Function"
❌ STILL says: "1:00:36 PM: 0 new function(s) to upload"
```

**CRITICAL FINDING:**
Even with a COMPLETE cache clear and fresh build, Netlify says "0 new function(s) to upload". This means:
1. The SSR function was built successfully
2. But Netlify's deployment system thinks the function is IDENTICAL to what's already deployed
3. The function content hash hasn't changed between builds

**This suggests the API routes were NEVER added to the SSR function, or they're being excluded somehow.**

**Redirects Configuration:**
- `_redirects` file exists: `/* /.netlify/functions/ssr 200`
- This should route all non-static requests to the SSR function

### 🎯 ROOT CAUSE FOUND (2025-10-19 1:07 PM EST)

**The Problem:**
```toml
# netlify.toml
[build]
  publish = "dist"  ← WRONG! This only deploys static files
```

**What Actually Happens:**
1. ✅ Astro builds SSR function to `.netlify/build/entry.mjs` (includes all API routes)
2. ✅ Astro builds static files to `dist/`
3. ❌ Netlify only deploys `dist/` (because publish = "dist")
4. ❌ SSR function at `.netlify/build/` is NEVER deployed
5. ❌ `_redirects` points to `/.netlify/functions/ssr` which doesn't exist
6. ❌ Result: 404 errors cached at edge

**The Fix:**
Remove `publish = "dist"` from netlify.toml. The @astrojs/netlify adapter automatically configures the correct publish directories when using `output: 'server'`.

**Verification:**
```bash
# Local build shows SSR function exists with API routes
$ cat apps/web/.netlify/build/entry.mjs | grep "api/"
const _page1 = () => import('./pages/api/contractors.astro.mjs');
const _page3 = () => import('./pages/api/upload-image.astro.mjs');

# But dist folder has no .netlify directory
$ ls apps/web/dist/.netlify/
No such file or directory

# The deployed site returns 404 from edge cache
$ curl -I https://nationalcontractorassociation.com/api/contractors
HTTP/2 404
cache-status: "Netlify Edge"; hit
```

**Why This Wasn't Obvious:**
- Local `.netlify/build/` folder shows API routes exist
- Build logs say "Generated SSR Function" (TRUE - but it's not deployed)
- Netlify says "0 new functions to upload" (TRUE - because publish dir excludes them)
- The build succeeds (TRUE - the function was built, just not deployed)

**OLD Hypothesis (INCORRECT):**
1. Static `/signup/index.html` exists and loads fine ✅
2. JavaScript in signup page tries to POST to `/api/upload-image` and `/api/contractors`
3. These requests should be caught by `/* /.netlify/functions/ssr 200` redirect
4. SSR function should handle API routes
5. BUT: If the SSR function is stale/cached from before API routes were added, it won't have the handlers

### Next Steps Required

**🚫 DO NOT:**
- Toggle `prerender` settings (tried 2x - doesn't fix routing)
- Make code changes without confirming deployment issue
- Assume environment variables are missing (they're documented as configured)

**✅ DO:**
1. Force a fresh SSR function deployment (clear Netlify cache)
2. Verify API routes are in the deployed SSR function
3. Check if Netlify is serving stale SSR function
4. Test API endpoints directly: `curl -X POST https://nationalcontractorassociation.com/api/contractors`

### Mistake Counter

| Mistake | Count | Description |
|---------|-------|-------------|
| Toggling prerender without understanding routing | ⚠️ 2 | Changed prerender settings thinking it would fix API routes |
| Making changes without deployment logs | ⚠️ 2 | Attempted fixes without seeing actual Netlify errors |
| Assuming problem is in code vs deployment | ⚠️ 2 | Code builds fine locally - issue is in Netlify |

---

## Template for New Issues

```markdown
## 🔴 ACTIVE ISSUE #X: [Issue Title]

**Issue ID**: `[SHORT-ID]`
**Status**: ACTIVE/RESOLVED
**Started**: YYYY-MM-DD
**Symptom**: [What the user sees]

### Attempt Log

#### Attempt #N - YYYY-MM-DD HH:MM
- **Action**: [What was done]
- **Reasoning**: [Why this approach was chosen]
- **Result**: ✅/❌ [What happened]
- **Root Cause**: [If failure, why it failed]
- **Commit**: [git hash]
- **Rollback**: [If reverted]

### Investigation Findings
[Key discoveries]

### Current Hypothesis
[What we think is causing the problem]

### Next Steps Required
**🚫 DO NOT:**
- [Actions to avoid]

**✅ DO:**
- [Correct next steps]

### Mistake Counter
| Mistake | Count | Description |
|---------|-------|-------------|
| [Pattern] | ⚠️ X | [Description] |
```

---

## Resolved Issues

(None yet)

---

## Rules Promoted to CLAUDE.md

(None yet - waiting for >5 repeat mistakes)
