<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- App pages live under `src/routes/_authenticated/` (client-only gate, redirects to `/auth`); each user's finance state is one JSON row in `finance_states` synced from the in-memory store in `src/lib/finance.ts` — why: keeps the existing local store/calculations unchanged while data persists per user.
- Generative chat uses an authenticated server function and reads the caller's own finance row after saving the visible snapshot; send only derived summaries without record names, notes or account identifiers to the model, so answers use current data without exposing other accounts.
- Live gold price comes from a public read-only server function (world spot price converted to Rupiah) and is stored in the user's profile unless they chose a manual price — why: no API key needed and zakat/nisab keep working offline from the last saved price.
- Keep `.env` tracked in git (not ignored): it holds only the public backend URL/publishable key, and the published build fails with "Missing Supabase environment variable(s)" without it.
