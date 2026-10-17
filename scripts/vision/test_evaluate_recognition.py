"""Unit test for the EVALUATOR ONLY, not for champion-recognition accuracy."""
import unittest
from evaluate_recognition import run

class EvaluatorTests(unittest.TestCase):
    def test_correct_wrong_unknown_slots(self):
        gt={"fixtureId":"test","screenType":"postgame_scoreboard","slots":[
            {"side":"ally","index":0,"championName":"Teemo"},
            {"side":"enemy","index":0,"championName":"Nunu & Willump"},
            {"side":"enemy","index":1,"championName":"Veigar"},
        ]}
        pred={"screenType":"postgame_scoreboard","slots":[
            {"side":"ally","index":0,"championName":"Teemo","confidence":0.9},
            {"side":"enemy","index":0,"championId":"nunu","confidence":0.7},
            {"side":"enemy","index":1,"championName":"Swain","confidence":0.98},
        ]}
        out=run(gt,pred,0.85)
        self.assertEqual(out['correctSlots'],2)
        self.assertEqual(out['wrongSlots'],1)
        self.assertEqual(out['confidentWrongSlots'],1)
        self.assertEqual(out['autoAcceptPrecision'],0.5)
        self.assertFalse(out['exactCompleteLineup'])
    def test_unsupported_website(self):
        out=run({"screenType":"unsupported","slots":[]},
                {"screenType":"unsupported","slots":[]},0.85)
        self.assertTrue(out['unsupportedScreenshotAcceptedCorrectly'])

    def test_unsupported_website_must_not_become_a_full_draft(self):
        out=run({"screenType":"unsupported","slots":[]},
                {"screenType":"postgame_scoreboard","slots":[{"side":"ally","index":0,"championName":"Swain","confidence":0.99}]},0.85)
        self.assertFalse(out['unsupportedScreenshotAcceptedCorrectly'])
        self.assertEqual(out['extraUnexpectedSlots'],['ally 0'])

    def test_single_champion_card_is_not_a_full_lineup(self):
        out=run({"screenType":"postgame_performance_single","slots":[]},
                {"screenType":"postgame_performance_single","slots":[]},0.85)
        self.assertTrue(out['singleChampionScreenHandledCorrectly'])

if __name__ == '__main__':
    unittest.main()
