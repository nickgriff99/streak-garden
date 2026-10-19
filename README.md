# Streak Garden

A habit tracker where each habit is a plant. Checking in waters it and it
grows through stages. Missing a day lets it wilt.

Growth stage is never stored in the database. It is always computed from
checkin history on read, so there is a single source of truth and no risk
of a stored stage drifting from the actual streak.

## Stack

- `client/`: Vite + React (plain JavaScript) single page app, React Router
  for client side routing, talks to the API over `fetch`.
- `server/`: Node.js + Express REST API, plain SQL through the `pg` package
  against PostgreSQL (hosted on Supabase).

No TypeScript, no ORM, no supabase-js SDK. Both sides are plain JavaScript
and plain SQL on purpose, so the code is easy to read and debug end to end.

## Running locally

### Database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the project dashboard, go to Project Settings > Database and copy the
   connection string (the "Connection pooling" one works fine, it is a
   normal `postgresql://` URL). This is your `DATABASE_URL`.
3. Run the schema against it once, from the `server/` directory:
   ```
   psql "<your DATABASE_URL>" -f src/db/schema.sql
   ```
   This creates the `users`, `habits`, and `checkins` tables and their
   indexes. It is safe to re-run, every statement is `create ... if not
   exists`. To undo it, uncomment and run the `drop table` block at the
   bottom of `schema.sql` instead.

   `schema.sql` also adds the `habits.species` column with `alter table
   ... add column if not exists`, so re-running it against a database that
   already has the `habits` table picks up the new column safely, with no
   data loss and no manual `alter table` needed.

   Alternatively, once `server/.env` has `DATABASE_URL` filled in, run
   `npm run migrate` from `server/` instead of calling `psql` directly
   (`server/src/db/migrate.js` just reads `schema.sql` and runs it through
   the same `pg` pool the app uses). Same safety guarantee: re-running it
   against a database that already has the tables does nothing and loses
   no data. This is intentionally not a real migration framework (no
   history table, no versioning) since the schema is small and stable;
   it is only meant for applying this one file, by hand or from a Render
   deploy hook, once per environment.
4. Supabase requires SSL, so leave `DATABASE_SSL` unset (or anything other
   than `"false"`) when pointing at Supabase. Only set it to `"false"` for
   a local Postgres install with no SSL listener.

### Server

```
cd server
npm install
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN
npm run dev
```

Fill in `.env`:

- `DATABASE_URL`: the Supabase connection string from above (or a local
  Postgres URL).
- `DATABASE_SSL`: leave unset for Supabase, set to `false` for local
  Postgres with no SSL.
- `JWT_SECRET`: any long random string, used to sign login/signup tokens.
- `CLIENT_ORIGIN`: where the client dev server runs, defaults to
  `http://localhost:5173`. The API's CORS is locked to this exact origin,
  not `*`.
- `PORT`: defaults to `4000`.

Runs on `http://localhost:4000` by default. `GET /api/health` returns
`{ status: "ok" }` once it is up.

### Client

```
cd client
npm install
cp .env.example .env   # VITE_API_URL should point at the server above
npm run dev
```

`VITE_API_URL` is the only client env var, it should match the server's
`PORT` above (`http://localhost:4000` by default).

Runs on `http://localhost:5173` by default.

## Running tests

### Server

Needs a real Postgres database to run against (an integration suite hits
it for real, nothing is mocked). Point `DATABASE_URL` at any throwaway
database with `schema.sql` already applied, for example a local Postgres
or a scratch Supabase project, then:

```
cd server
npm test
```

### Client

Component tests only, no backend needed:

```
cd client
npm test
```

## Deploying (Render)

`render.yaml` at the repo root defines both services as a Render Blueprint:
`streak-garden-server` (Node web service, root dir `server`, build `npm
install`, start `npm start`) and `streak-garden-client` (static site, root
dir `client`, build `npm install && npm run build`, publish path `dist`).
In the Render dashboard, use "New > Blueprint" and point it at this repo;
Render reads the file and creates both services.

Deploy order matters, and it is three passes, not two, because the two env
vars that connect the services point in opposite directions and neither
service's real URL exists until it has been deployed once:

1. **Server first.** Deploy `streak-garden-server`. For `CLIENT_ORIGIN`,
   leave it as `http://localhost:5173` (or any placeholder) for this first
   deploy, since the client does not have a real URL yet. Render assigns
   the server a `https://streak-garden-server-xxxx.onrender.com` URL once
   it is live. The server already listens on `process.env.PORT`, which
   Render injects, so no code change is needed there.
2. **Client second.** Now set the client's `VITE_API_URL` env var on
   Render to that server URL from step 1, then deploy
   `streak-garden-client`. Vite bakes `VITE_API_URL` into the built JS at
   build time, not read at runtime, so the server's URL has to exist
   before the client's build step runs. Render assigns the client a
   `https://streak-garden-client-xxxx.onrender.com` URL once it is live.
3. **Server again.** Go back to `streak-garden-server`'s env vars on
   Render and set `CLIENT_ORIGIN` to the client's real URL from step 2,
   then trigger a manual redeploy of the server. This step is not
   optional: the server's CORS check (`server/src/app.js`) reads
   `process.env.CLIENT_ORIGIN` at request time, and every request from the
   real client will be rejected by CORS until this is set to the client's
   actual origin instead of the local dev placeholder from step 1.

Both `VITE_API_URL` and `CLIENT_ORIGIN` have the same chicken-and-egg
shape, just pointing opposite ways: the client needs the server's URL
baked in at build time, the server needs the client's URL set at request
time for CORS. That is why each one needs a follow-up pass once the other
side's real URL exists, step 2 for the client and step 3 for the server.

Env vars are listed in `render.yaml` with `sync: false`, which means Render
prompts for a value in the dashboard instead of storing it in the file.
Fill in for the server: `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`,
`CLIENT_ORIGIN`. Fill in for the client: `VITE_API_URL`.

If either service's URL ever changes later (renamed service, new region,
etc.), repeat the relevant half of this: a changed server URL needs the
client's `VITE_API_URL` updated and the client rebuilt and redeployed
(env var changes alone do nothing until Vite's build step reruns); a
changed client URL needs the server's `CLIENT_ORIGIN` updated and the
server redeployed.

### Verifying a deploy

After step 1 (and again after step 3), confirm the server is actually up
before moving on:

```
curl https://streak-garden-server-xxxx.onrender.com/api/health
```

Expect `{"status":"ok"}`. If this does not come back, stop and fix the
server deploy before touching the client, the client has nothing to talk
to otherwise.

### Rolling out a schema change (example: plant species)

The three-pass dance above is only for the very first deploy of each
service. Once both services are live, a normal feature that adds a column
(like the `habits.species` column) ships in a straight line, not a
chicken-and-egg loop:

1. Run `npm run migrate` against the live `DATABASE_URL` first.
2. Deploy the updated server. This has to come after step 1, since the
   server's `species`-aware queries would error against a schema that does
   not have the column yet.
3. Deploy the updated client any time after step 2. This is safe to lag:
   the new `habits.species` column has a default, so old server code
   keeps working unchanged against it, and even a client deploy that
   lands slightly early is harmless, since extra `species` data sent to
   the old server is simply ignored, and a missing `species` field coming
   back from an old server response falls back to the default plant in
   the client.

### Rollback

Render keeps previous successful deploys for both services. To roll back
either one, open that service in the Render dashboard and redeploy a
previous successful build from its deploy history, no code change needed.

There is no database rollback step for this app. `schema.sql` only adds
tables/indexes with `create ... if not exists` and is run through
`npm run migrate`; there is nothing destructive in a normal deploy to undo,
so rolling back the server or client code never needs a matching down
migration.

## Data model

- `users`: id, email, password_hash, created_at
- `habits`: id, user_id, name, species (one of sunflower, cactus, mushroom, clover, bonsai, default sunflower), created_at
- `checkins`: id, habit_id, date, created_at, unique on (habit_id, date)

## Growth stages

Computed from the current streak length in `server/src/utils/growth.js`:

| Streak length | Stage |
| --- | --- |
| 0-1 days | seed |
| 2-4 days | sprout |
| 5-9 days | sapling |
| 10-20 days | bloom |
| 21+ days | flourishing |

If the most recent checkin is more than one day old, the streak resets to
0 and the habit is marked wilted.

## Plant species

Each habit has a `species` (sunflower, cactus, mushroom, clover, or
bonsai), picked when the habit is created and defaulting to sunflower if
omitted. It is purely cosmetic, it only changes which pixel art is
rendered and has no effect on growth-stage computation. The allowed list
is validated server side; an unlisted species is rejected with a 400.
