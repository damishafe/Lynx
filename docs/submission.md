# Submission paragraph

Lynx ProofLoop is a verification layer for AI-written code, built for operators running 5–30
short-term rentals and for developers who ship with coding agents and need more than the
agent's own word that a change is safe. The coding agent is Claude Code: it writes the Lynx
operations dashboard (bookings, cleaning, vendor payouts, a live profitability ledger), and on
every attempted stop, Kane CLI replays four committed business-invariant flows in a real headless
Chrome — booking → occupancy → revenue, checkout → one cleaning job, cleaning completion →
one vendor payout → unit readiness, and the Net = Revenue − Costs ledger invariant — feeding
Kane's `run_end` back to Claude as a structured block reason until every flow passes, for up to
three repair attempts before handing off to a human. Run it with `node proofloop/src/cli.ts
verify --all` after `npm i -g @testmuai/kane-cli && kane-cli login`, or watch it happen live at
`http://localhost:3000/proofloop`.
