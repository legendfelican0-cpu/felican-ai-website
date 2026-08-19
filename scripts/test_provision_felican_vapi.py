import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("provision-felican-vapi.py")
SPEC = importlib.util.spec_from_file_location("provision_felican_vapi", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ProvisionFelicanVapiTests(unittest.TestCase):
    def test_payload_uses_cops_voice_without_cops_business_context(self):
        payload = MODULE.assistant_payload("https://felican.dev/", "secret-value")
        self.assertEqual(payload["voice"]["voiceId"], "cgSgspJ2msm6clMCkdW9")
        self.assertEqual(payload["model"]["url"], "https://felican.dev/v1")
        self.assertEqual(payload["model"]["headers"]["x-vapi-secret"], "secret-value")
        self.assertIsNone(payload["firstMessage"])
        self.assertEqual(payload["firstMessageMode"], "assistant-waits-for-user")
        self.assertFalse(payload["endCallFunctionEnabled"])
        self.assertNotIn("COPS", json_text(payload))
        model_prompt = payload["model"]["messages"][0]["content"]
        self.assertIn("always spell the company name exactly Felican AI", model_prompt)
        self.assertIn("Always spell Ballas", model_prompt)

    def test_payload_supports_separate_dev_and_prod_assistant_names(self):
        dev = MODULE.assistant_payload(
            "https://felican.dev",
            "dev-secret",
            "Felican AI Website Voice (DEV)",
        )
        prod = MODULE.assistant_payload(
            "https://felican.ai",
            "prod-secret",
            "Felican AI Website Voice (PROD)",
        )
        self.assertEqual(dev["name"], "Felican AI Website Voice (DEV)")
        self.assertEqual(dev["model"]["url"], "https://felican.dev/v1")
        self.assertEqual(prod["name"], "Felican AI Website Voice (PROD)")
        self.assertEqual(prod["model"]["url"], "https://felican.ai/v1")
        self.assertNotEqual(dev["model"]["headers"]["x-vapi-secret"], prod["model"]["headers"]["x-vapi-secret"])

    def test_env_update_preserves_unrelated_values_and_replaces_voice_values(self):
        with tempfile.TemporaryDirectory() as folder:
            env_path = Path(folder) / "ai.env"
            env_path.write_text("ANTHROPIC_API_KEY=keep-me\nFELICAN_VAPI_ASSISTANT_ID=old\n")
            MODULE.update_env(env_path, {
                "FELICAN_VAPI_ASSISTANT_ID": "new",
                "FELICAN_VAPI_PUBLIC_KEY": "public",
            })
            values = MODULE.parse_env(env_path)
            self.assertEqual(values["ANTHROPIC_API_KEY"], "keep-me")
            self.assertEqual(values["FELICAN_VAPI_ASSISTANT_ID"], "new")
            self.assertEqual(values["FELICAN_VAPI_PUBLIC_KEY"], "public")
            self.assertEqual(env_path.stat().st_mode & 0o777, 0o600)


def json_text(value):
    import json
    return json.dumps(value)


if __name__ == "__main__":
    unittest.main()
