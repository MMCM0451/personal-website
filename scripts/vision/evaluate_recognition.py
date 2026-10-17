#!/usr/bin/env python3
"""Score real Rift Lab recognition output against annotated screenshots.

Usage:
  python scripts/evaluate_recognition.py fixtures/ranked_scoreboard_swain_jinx.labels.json /path/to/actual_recognition_output.json

Prediction JSON expected:
  {"screenType":"postgame_scoreboard","slots":[
    {"side":"ally","index":0,"championName":"Teemo","confidence":0.93}, ...
  ]}
`championId` or `champion` are also accepted. Missing champion is an abstention.

IMPORTANT: This is an evaluation utility, NOT a recogniser. A synthetic or
hand-copied prediction does not count as proof the app recognises screenshots.
"""

import argparse
import json
import re
from pathlib import Path


def norm(value):
    raw = re.sub(r"[^a-z0-9]", "", str(value or "").lower())
    aliases = {"nunuandwillump": "nunu", "nunuwillump": "nunu", "monkeyking": "wukong", "mf": "missfortune", "yi": "masteryi"}
    return aliases.get(raw, raw)


def get_name(row):
    return row.get("championName") or row.get("championId") or row.get("champion") or ""


def run(gt, pred, threshold):
    expected_layout = gt.get("screenType", "unknown")
    predicted_layout = pred.get("screenType") or pred.get("screen_type") or "unknown"
    truths = {(s["side"], int(s["index"])): s for s in gt.get("slots", [])}
    predicted = {(s.get("side"), int(s.get("index", -1))): s for s in pred.get("slots", [])}
    if len(predicted) != len(pred.get("slots", [])):
        raise ValueError("Duplicate side/index predictions in a single image")
    total = len(truths)
    correct = wrong = unknown = confident = confident_correct = confident_wrong = 0
    errors = []
    for key, truth in truths.items():
        actual = predicted.get(key)
        name = get_name(actual or {})
        if not name:
            unknown += 1
            errors.append({"slot": f"{key[0]} {key[1]}", "expected": truth["championName"], "prediction": "UNKNOWN"})
            continue
        same = norm(name) == norm(truth["championName"])
        if same:
            correct += 1
        else:
            wrong += 1
            errors.append({"slot": f"{key[0]} {key[1]}", "expected": truth["championName"], "prediction": name})
        conf = actual.get("confidence")
        if isinstance(conf, (int, float)) and 0 <= conf <= 1 and conf >= threshold:
            confident += 1
            if same:
                confident_correct += 1
            else:
                confident_wrong += 1
    extra = [f"{side} {index}" for side, index in predicted.keys() if (side, index) not in truths]
    if total == 0 and predicted:
        errors.append({"unexpectedAutoFilledSlots": extra})
    result = {
        "fixture": gt.get("fixtureId", "unknown"),
        "expectedScreenType": expected_layout,
        "predictedScreenType": predicted_layout,
        "layoutCorrect": predicted_layout == expected_layout,
        "visibleTruthSlots": total,
        "correctSlots": correct,
        "wrongSlots": wrong,
        "unknownSlots": unknown,
        "extraUnexpectedSlots": extra,
        "top1AccuracyAcrossVisibleSlots": (correct / total if total else None),
        "recognizedCoverage": ((correct + wrong) / total if total else None),
        "autoAcceptThreshold": threshold,
        "confidentAcceptedSlots": confident,
        "confidentWrongSlots": confident_wrong,
        "autoAcceptPrecision": (confident_correct / confident if confident else None),
        "autoAcceptCoverage": (confident / total if total else None),
        "exactCompleteLineup": (correct == total and wrong == 0 and unknown == 0 and not extra and total > 0),
        "errors": errors,
    }
    if total == 0:
        result["nonLineupScreenshotHandledCorrectly"] = (predicted_layout == expected_layout and not predicted)
        if expected_layout == "unsupported":
            result["unsupportedScreenshotAcceptedCorrectly"] = result["nonLineupScreenshotHandledCorrectly"]
        if expected_layout == "postgame_performance_single":
            result["singleChampionScreenHandledCorrectly"] = result["nonLineupScreenshotHandledCorrectly"]
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("annotations", type=Path)
    parser.add_argument("predictions", type=Path)
    parser.add_argument("--min-confidence", type=float, default=0.85)
    args = parser.parse_args()
    if not 0 <= args.min_confidence <= 1:
        parser.error("--min-confidence must be between 0 and 1")
    gt = json.loads(args.annotations.read_text(encoding="utf8"))
    prediction = json.loads(args.predictions.read_text(encoding="utf8"))
    print(json.dumps(run(gt, prediction, args.min_confidence), indent=2))


if __name__ == "__main__":
    main()
