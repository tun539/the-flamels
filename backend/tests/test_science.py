import unittest
from backend.app.science import oxygen_partial_pressure


class AtmosphereTests(unittest.TestCase):
    def test_fraction_and_kpa(self):
        self.assertAlmostEqual(oxygen_partial_pressure(0.21, 100), 21)

    def test_zero_oxygen(self):
        self.assertEqual(oxygen_partial_pressure(0, 100), 0)

    def test_invalid_inputs(self):
        for fraction, pressure in [(21, 100), (-0.1, 100), (0.21, 0),
                                   (float("nan"), 100), (0.21, float("inf"))]:
            with self.subTest(fraction=fraction, pressure=pressure):
                with self.assertRaises(ValueError):
                    oxygen_partial_pressure(fraction, pressure)
