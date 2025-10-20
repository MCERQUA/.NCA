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

### Deployment Attempts (2025-10-19 Evening)

#### Attempt #3 - 7:08 PM (Commit: acfbab7)
- **Action**: Removed `publish = "dist"` from netlify.toml
- **Reasoning**: Let @astrojs/netlify adapter auto-configure publish directory
- **Result**: ❌ Site deployed but entire site shows 404
- **Netlify Deploy Log**: "1 new function(s) to upload" ✅ (first time function uploaded!)

#### Attempt #4 - 7:12 PM (Commit: f4b53fc)
- **Action**: Re-added `publish = "dist"` to netlify.toml
- **Result**: ❌ Deploy failed: "Deploy directory 'apps/web/apps/web/dist' does not exist"
- **Root Cause**: UI has `packagePath: apps/web`, config has `publish: dist` → doubled path

#### Attempt #5 - 7:15 PM (Commit: 2d41a3a)
- **Action**: Removed both `base` and `publish` from netlify.toml
- **Result**: ✅ Build succeeded, ❌ Homepage 404, ✅ API returns 403 (CSRF - means it exists!)
- **Netlify Deploy Log**: "1 new function(s) to upload"

#### Attempt #6 - 7:30 PM (Commit: a6c2222)
- **Action**: Added `publish = "dist"` back
- **Result**: ❌ Deploy failed: "Deploy directory 'dist' does not exist"
- **Root Cause**: Looking for `/opt/build/repo/dist` but files are at `/opt/build/repo/apps/web/dist`

#### Attempt #7 - 7:32 PM (Commit: a6646b5)
- **Action**: Changed to `publish = "apps/web/dist"`
- **Result**: ✅ Site deployed, Homepage works, ❌ API routes still 404
- **Root Cause**: Static files deployed from `apps/web/dist`, but SSR function at `apps/web/.netlify/` not included

#### Attempt #8 - 7:45 PM (Commit: 1a6a401)
- **Action**: Added `base = "apps/web"` and `publish = "dist"`
- **Result**: ❌ Site works (HTTP 200), API still 404
- **Reasoning**: Base directory tells Netlify where to work from, should find both dist/ and .netlify/
- **Deployment Log**:
  - Build: `[@astrojs/netlify] Generated SSR Function` ✅
  - Deploy: `Starting to deploy site from 'apps/web/dist'`
  - Deploy: `0 new function(s) to upload` ❌ **SSR FUNCTION NOT DEPLOYED**
- **Test Results**:
  - `curl -I /` → HTTP 200 ✅
  - `curl -I /api/contractors` → HTTP 404 ❌

### 📋 CURRENT NETLIFY UI SETTINGS (as of 2025-10-19 8:15 PM)

```
Base directory:      /
Package directory:   apps/web
Build command:       pnpm build
Publish directory:   apps/web/dist  ← FULL PATH from repo root
Functions directory: apps/web/.netlify/functions-internal  ← FULL PATH from repo root
```

**CRITICAL DISCOVERY (from attempt #10):**
Package directory does NOT apply to Publish/Functions directories! All paths resolve from repo root independently.
Must specify FULL paths: `apps/web/dist` and `apps/web/.netlify/functions-internal`

**netlify.toml Current Config:**
```toml
[build]
  base = "apps/web"
  command = "pnpm build"
  publish = "dist"
```

**Combined Effect:**
- Netlify works from package directory: `apps/web`
- netlify.toml sets base: `apps/web` (redundant with UI)
- netlify.toml sets publish: `dist`
- Final deploy path: `apps/web/dist` (static files only)
- SSR function at `apps/web/.netlify/` is NOT deployed

### 🛑 STOPPING - FUNDAMENTAL ARCHITECTURE ISSUE IDENTIFIED

**The Real Problem:**

Astro's `output: 'server'` mode with @astrojs/netlify adapter creates:
```
apps/web/
├── dist/          ← Static files (HTML, CSS, JS, images)
└── .netlify/      ← SSR function
    └── build/
        └── entry.mjs (contains API routes)
```

These are **sibling directories**. But Netlify's `publish` setting can only deploy ONE directory.

**Why every attempt failed:**
- `publish = "dist"` → Deploys only `apps/web/dist/`, excludes `.netlify/` → No SSR function
- `publish = "apps/web/dist"` → Same result, different path
- No publish setting → Netlify can't find files → 404 everywhere
- `base = "apps/web"` + `publish = "dist"` → Deploys only `dist/`, excludes `.netlify/` → No SSR function

**The Netlify UI setting `packagePath: apps/web` is also interfering.**

**Attempts: 8/8 failed - All variations tested**

#### Attempt #9 - 8:06 PM (Commit: 3d75a82)
- **Action**: Removed `base` and `publish` from netlify.toml, fixed Functions directory in UI to `.netlify/functions-internal`
- **Reasoning**: Deployment #5 uploaded function successfully, fixing functions dir might allow both to work
- **Netlify UI Changes**: Functions directory: `netlify/functions` → `.netlify/functions-internal`
- **Result**: ❌ EVERYTHING 404 (homepage and API both fail)
- **Test Results**:
  - `curl -I /` → HTTP 404 ❌
  - `curl -I /api/contractors` → HTTP 404 ❌
- **Same as deployment #5 - Netlify can't find static files without publish directory**

**Attempts: 9/9 failed**

#### Attempt #10 - 8:10 PM (Manual redeploy, no commit)
- **Action**: Set Publish directory in UI to `dist`
- **Reasoning**: UI package directory + publish directory should combine to find files
- **Netlify UI**: Publish directory set to `dist`, Functions directory = `.netlify/functions-internal`
- **Result**: ❌ Deploy failed - "Deploy directory 'dist' does not exist"
- **Deployment Log**:
  - `publish: /opt/build/repo/dist` ← Looking at WRONG PATH
  - `functionsDirectory: /opt/build/repo/.netlify/functions-internal` ← Also WRONG
  - Actual files are at: `/opt/build/repo/apps/web/dist/` and `/opt/build/repo/apps/web/.netlify/`
- **Root Cause**: UI's "Package directory" does NOT apply to "Publish directory" or "Functions directory" paths!

**KEY FINDING:**
The Package directory setting (`apps/web`) is NOT prefixed to the Publish/Functions directory settings. They're all resolved from repo root independently.

**Attempts: 10/10 failed - THRESHOLD EXCEEDED**

### CIRCULAR PATTERN IDENTIFIED ⚠️⚠️⚠️

**The Loop:**
1. Remove publish → Site 404s
2. Add publish = "dist" → Build fails (wrong path)
3. Add publish = "apps/web/dist" → Site works, API 404s
4. Add base = "apps/web" + publish = "dist" → Back to step 1?

**Attempts: 8 total (exceeds threshold of 5)**

### Mistake Counter

| Mistake | Count | Description |
|---------|-------|-------------|
| Toggling publish directory without understanding paths | 🔴 8 | Repeatedly changed netlify.toml publish settings in a circle |
| Making changes without deployment logs | ⚠️ 2 | Attempted fixes without seeing actual Netlify errors |
| Not documenting deployment results immediately | 🔴 8 | Failed to track each deployment outcome before trying next fix |

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
