"""Release-integrity checks for the complete research platform launcher."""
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from research_platform import load_release, prepare, verify_sources


class ReleaseTests(unittest.TestCase):
    def test_release_checksums_and_source_pin_are_valid(self):
        lock, patch_file, manifest = load_release()
        self.assertEqual(lock["commit"], "9817452c3effdf03864dea65f23d1f767b33251b")
        self.assertGreater(patch_file.stat().st_size, 0)
        self.assertEqual(len(manifest), lock["source_file_count"])
        self.assertEqual(len({r["path"] for r in manifest}), len(manifest))

    def test_corrupted_or_missing_source_is_rejected_without_changes(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            source = root / "data.csv"
            source.write_bytes(b"reported data\n")
            manifest = [{"path": "data.csv", "sha256": hashlib.sha256(source.read_bytes()).hexdigest()}]
            verify_sources(root, manifest)
            source.write_bytes(b"user edits\n")
            with self.assertRaisesRegex(RuntimeError, "integrity"):
                verify_sources(root, manifest)
            self.assertEqual(source.read_bytes(), b"user edits\n")

    def test_manifest_cannot_read_outside_checkout(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(RuntimeError, "outside"):
                verify_sources(Path(tmp), [{"path": "../private-file", "sha256": "0" * 64}])

    def test_unmanaged_directory_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            document = root / "user-work.txt"
            document.write_text("retain me")
            with patch("research_platform.SOURCE", root):
                with self.assertRaisesRegex(RuntimeError, "preserved"):
                    prepare()
            self.assertEqual(document.read_text(), "retain me")


if __name__ == "__main__":
    unittest.main()
