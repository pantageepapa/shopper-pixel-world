"""Export read-only MiroFish Reddit conversation data for the static viewer."""

import argparse
from datetime import datetime
import json
from pathlib import Path
import sqlite3
import time

WORKSPACE = Path(__file__).resolve().parents[1]
CASES = {"hoodie": "private-choice-trendy-social-01", "kite": "private-choice-kite-travel-social-01"}
ROWS = """
WITH messages AS (
  SELECT 'post' AS kind, post_id AS id, user_id, content, created_at,
         original_post_id AS parent_post_id
  FROM post
  UNION ALL
  SELECT 'comment', comment_id, user_id, content, created_at, post_id
  FROM comment
)
SELECT messages.*, user.name AS actor,
       (SELECT COUNT(*) FROM trace
        WHERE action='refresh' AND trace.user_id=messages.user_id
          AND trace.created_at<=messages.created_at) AS round
FROM messages
JOIN user USING (user_id)
ORDER BY messages.created_at, messages.kind, messages.id
"""


def source_json(path):
    try:
        return json.loads(path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def completed_rounds(run_dir, total):
    path = run_dir / "log" / "oasis.env.log"
    if not path.exists():
        return 0
    # OASIS logs the seed and each complete environment step. Later steps may be private IPC.
    boundaries = path.read_text().count("oasis.env - performed all actions.")
    return min(total, max(0, boundaries - 1))


def snapshot(run_dir, manifest):
    total = manifest["rounds"]
    done = completed_rounds(run_dir, total)
    run = source_json(run_dir / "run_state.json")
    entries = []
    database = run_dir / "reddit_simulation.db"
    if database.exists():
        with sqlite3.connect(database.as_uri() + "?mode=ro", uri=True) as connection:
            connection.row_factory = sqlite3.Row
            for row in connection.execute(ROWS):
                if row["round"] > total:
                    continue
                parent = row["parent_post_id"]
                entries.append({
                    "id": f'{row["kind"]}-{row["id"]}',
                    "kind": row["kind"],
                    "actor": row["actor"],
                    "round": row["round"],
                    "parent_id": f"post-{parent}" if parent is not None else None,
                    "text": row["content"],
                    "timestamp": datetime.fromisoformat(row["created_at"]).isoformat(),
                })
    if done == total:
        state = "completed"
    elif run.get("runner_status") in {"failed", "error"}:
        state = "failed"
    elif run.get("runner_status") in {"stopped", "interrupted"}:
        state = "stopped"
    else:
        state = "running" if run or entries else "pending"
    current = min(total, max(done, max((item["round"] for item in entries), default=0)))
    return {
        "simulation_id": manifest["simulation_id"],
        "state": state,
        "rounds_total": total,
        "rounds_completed": done,
        "current_round": current,
        "entries": entries,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("run_dir", type=Path, help="MiroFish backend simulation directory")
    parser.add_argument("--case", choices=CASES, default="hoodie")
    parser.add_argument("--watch", action="store_true", help="refresh until discussion completes")
    args = parser.parse_args()
    run_dir = args.run_dir.resolve()
    root = WORKSPACE / CASES[args.case]
    output = root / "transcript.json"
    manifest = source_json(root / "manifest.json")
    if run_dir.name != manifest.get("simulation_id"):
        parser.error("run directory does not match the registered study")
    while True:
        value = snapshot(run_dir, manifest)
        temporary = output.with_suffix(".tmp")
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
        temporary.replace(output)
        if not args.watch or value["state"] in {"completed", "stopped", "failed"}:
            break
        time.sleep(1)


if __name__ == "__main__":
    main()
