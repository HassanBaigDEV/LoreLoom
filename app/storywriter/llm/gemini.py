import os
from openai import OpenAI
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
        )
        self.extra_headers = {
            "HTTP-Referer": os.getenv("SITE_URL", "http://localhost:3000"),
            "X-Title": os.getenv("SITE_NAME", "StoryWriter"),
        }
        self.model = "google/gemini-2.0-flash-exp:free"

    def __call__(self, prompt: str, **kwargs) -> dict:
        try:
            messages = self._format_prompt(prompt)
            completion = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=messages,
                **kwargs,
            )
            return {"choices": [{"text": completion.choices[0].message.content}]}
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            raise

    async def _json(self, prompt: str, response_format: dict, **kwargs) -> dict:
        try:
            messages = self._format_prompt(prompt)
            completion = self.client.chat.completions.create(
                extra_headers=self.extra_headers,
                model=self.model,
                messages=messages,
                response_format=response_format,  # type: ignore
                **kwargs,
            )
            # print(completion)
            # print(completion.choices[0].message.content)
            return {"choices": [{"text": completion.choices[0].message.content}]}
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            raise

    def _format_prompt(self, prompt: str) -> list:
        """Convert llama.cpp style prompts to ChatCompletion format"""
        parts = prompt.split("<|im_start|>")
        messages = []

        for part in parts:
            if not part.strip():
                continue

            if "system" in part:
                content = part.split("system", 1)[1].split("<|im_end|>")[0].strip()
                messages.append({"role": "system", "content": content})
            elif "user" in part:
                content = part.split("user", 1)[1].split("<|im_end|>")[0].strip()
                messages.append({"role": "user", "content": content})
            elif "assistant" in part:
                content = part.split("assistant", 1)[1].split("<|im_end|>")[0].strip()
                messages.append({"role": "assistant", "content": content})

        return messages


# Initialize global model instance
model = GeminiClient()
