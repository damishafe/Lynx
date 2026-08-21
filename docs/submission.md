# Submission paragraph

Lynx ProofLoop is a verification layer for AI-written code, built for operators running 5–30
short-term rentals and for developers who ship with coding agents and need more than the
agent's own word that a change is safe. The coding agent is Claude Code: it writes the Lynx
operations dashboard (bookings, cleaning, vendor payouts, a live profitability ledger), and on
every attempted stop, Kane CLI runs four business-invariant flows in a real headless Chrome —
booking → occupancy → revenue, checkout → one cleaning job, cleaning completion → one vendor
payout → unit readiness, and the Net = Revenue − Costs ledger invariant — the first run authors
each test (spends credits), and every run after that replays the committed `kane/output-*/`
recording for free. Kane's `run_end` feeds back to Claude as a structured block reason (exit
code 2, reason on stderr) until every flow passes, with two automatic repair rounds before
handing off to a human. Run it with `node proofloop/src/cli.ts verify --all` from the repo root
after `npm i -g @testmuai/kane-cli && kane-cli login`, or watch it happen live at
[`https://lynx-kane.vercel.app/proofloop`](https://lynx-kane.vercel.app/proofloop) (production)
or `http://localhost:3000/proofloop` (local).
