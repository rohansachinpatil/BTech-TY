# BTech TY Study Workspace

Yeh project static HTML, CSS aur JavaScript website hai. Website ka entry point root `index.html` hai; Database System Design ke notes `subject/Database System Design/` mein hain. Shared design files `assets/` mein hain.

## Vercel par host karna

1. Vercel mein GitHub repository `rohansachinpatil/BTech-TY` import karo.
2. Root Directory repository root hi rakho.
3. `vercel.json` Framework Preset ko **Other**, build command ko blank, aur output directory ko repository root (`.`) set karta hai.
4. Deploy chuno. Is static site ko package install ya build step ki zarurat nahi.

Nayi commits GitHub par push hone ke baad Vercel project configured hone par redeploy karega.
