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

### Deployment Log Analysis (2025-10-19 12:52 PM)

**Build Output:**
```
✅ Build successful: "16:53:39 [build] Complete!"
✅ SSR Function generated: "16:53:39 [@astrojs/netlify] Generated SSR Function"
✅ Signup page prerendered: "/signup/index.html"
⚠️ Deploy shows: "0 new file(s) to upload" and "0 new function(s) to upload"
```

**Critical Finding:**
The deployment says "0 new function(s) to upload" - meaning Netlify is using the CACHED SSR function from a previous deployment, not the newly built one.

**Redirects Configuration:**
- `_redirects` file exists: `/* /.netlify/functions/ssr 200`
- This should route all non-static requests to the SSR function

**Hypothesis:**
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
