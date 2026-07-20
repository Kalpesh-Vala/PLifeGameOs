# GitHub Models — Access & Configuration Guide

A practical reference for the [GitHub Models](https://github.com/marketplace/models) inference API, listing which
models are accessible with a standard token and what configuration each one
requires. Use this to onboard other developers quickly.

> Results below were captured on **2026-07-15** using `test.py` in this folder.
> Availability can change over time — re-run `python test.py` to refresh.

---

## 1. Setup

### Prerequisites
- Python 3.9+
- A **GitHub personal access token** with the **`Models: read`** permission
  (fine-grained token — no repo access required). Create one at
  <https://github.com/settings/tokens>.

### Install dependencies
```bash
pip install openai httpx python-dotenv
```

### Configure the token
Create a `.env` file in the project folder (never commit it):
```env
GITHUB_TOKEN=your_token_here
```

### Endpoint
| Purpose        | URL                                              |
| -------------- | ------------------------------------------------ |
| Inference      | `https://models.github.ai/inference`             |
| Model catalog  | `https://models.github.ai/catalog/models`        |

---

## 2. Client configuration

The API is OpenAI-compatible. The **recommended base client** below works for the
widest set of models:

```python
from openai import OpenAI

client = OpenAI(
    api_key=GITHUB_TOKEN,
    base_url="https://models.github.ai/inference",
    timeout=30,
    max_retries=0,
    # Required so newer reasoning models (o1-mini, o1-preview) route correctly:
    default_query={"api-version": "2024-12-01-preview"},
)
```

### Key configuration rules
| Rule | Applies to | Detail |
| ---- | ---------- | ------ |
| Use `max_completion_tokens` instead of `max_tokens` | all `gpt-5*`, `o1*`, `o3*`, `o4*` | These models **reject** `max_tokens` with HTTP 400. |
| Send `api-version=2024-12-01-preview` | `o1-mini`, `o1-preview` | Without it they return `enabled only for api versions 2024-12-01-preview and later`. |
| Use `max_tokens` (standard) | all other chat models | `gpt-4.1*`, `gpt-4o*`, `cohere`, `deepseek-r1`, `meta/llama*`, `mistral*`, `phi-4*`. |

A safe pattern that works for **every** chat model is to try `max_tokens`
first and fall back to `max_completion_tokens` on a 400 (see `test.py`).

---

## 3. Accessible models (29)

### OpenAI — GPT family (standard `max_tokens`)
| Model ID | Token param | Notes |
| -------- | ----------- | ----- |
| `openai/gpt-4.1` | `max_tokens` | Full-size; slower first call (~7s cold). |
| `openai/gpt-4.1-mini` | `max_tokens` | Fast. |
| `openai/gpt-4.1-nano` | `max_tokens` | Fastest GPT. |
| `openai/gpt-4o` | `max_tokens` | Multimodal-capable. |
| `openai/gpt-4o-mini` | `max_tokens` | Fast, cheap. |

### OpenAI — GPT-5 family (requires `max_completion_tokens`)
| Model ID | Token param | Notes |
| -------- | ----------- | ----- |
| `openai/gpt-5` | `max_completion_tokens` | Rejects `max_tokens`. |
| `openai/gpt-5-chat` | `max_completion_tokens` | Chat-tuned. |
| `openai/gpt-5-mini` | `max_completion_tokens` | |
| `openai/gpt-5-nano` | `max_completion_tokens` | |

### OpenAI — Reasoning models (`o` series, requires `max_completion_tokens`)
| Model ID | Token param | Extra config | Notes |
| -------- | ----------- | ------------ | ----- |
| `openai/o1` | `max_completion_tokens` | — | Slower (~5s). |
| `openai/o1-mini` | `max_completion_tokens` | `api-version=2024-12-01-preview` | |
| `openai/o1-preview` | `max_completion_tokens` | `api-version=2024-12-01-preview` | |
| `openai/o3` | `max_completion_tokens` | — | |
| `openai/o3-mini` | `max_completion_tokens` | — | |
| `openai/o4-mini` | `max_completion_tokens` | — | |

### Other providers (standard `max_tokens`)
| Model ID | Provider | Notes |
| -------- | -------- | ----- |
| `cohere/cohere-command-a` | Cohere | Fast. |
| `deepseek/deepseek-r1` | DeepSeek | Reasoning model. |
| `meta/llama-3.3-70b-instruct` | Meta | |
| `meta/llama-4-maverick-17b-128e-instruct-fp8` | Meta | |
| `meta/llama-4-scout-17b-16e-instruct` | Meta | |
| `mistral-ai/codestral-2501` | Mistral | Code-focused. |
| `mistral-ai/ministral-3b` | Mistral | Small, fast. |
| `mistral-ai/mistral-medium-2505` | Mistral | |
| `mistral-ai/mistral-small-2503` | Mistral | |
| `microsoft/phi-4` | Microsoft | Can be slow/cold — allow a longer timeout. |
| `microsoft/phi-4-mini-instruct` | Microsoft | |
| `microsoft/phi-4-mini-reasoning` | Microsoft | |
| `microsoft/phi-4-multimodal-instruct` | Microsoft | |
| `microsoft/phi-4-reasoning` | Microsoft | |

---

## 4. Not accessible (8) — with root cause

| Model ID | Status | Root cause | Fixable? |
| -------- | ------ | ---------- | -------- |
| `openai/text-embedding-3-large` | ❌ 400 | Embedding model — not valid for `chat/completions`. Use the **embeddings** endpoint. | Different endpoint |
| `openai/text-embedding-3-small` | ❌ 400 | Same as above. | Different endpoint |
| `deepseek/deepseek-r1-0528` | ❌ 500 | `Model service is unavailable` — temporary server-side outage. | Retry later |
| `deepseek/deepseek-v3-0324` | ❌ 500 | Same temporary outage. | Retry later |
| `meta/llama-3.2-11b-vision-instruct` | ❌ 400 | `unknown_model` — listed in catalog but rejected by inference endpoint. | GitHub-side |
| `meta/llama-3.2-90b-vision-instruct` | ❌ 400 | `unknown_model`. | GitHub-side |
| `meta/meta-llama-3.1-405b-instruct` | ❌ 400 | `unknown_model`. | GitHub-side |
| `meta/meta-llama-3.1-8b-instruct` | ❌ 400 | `unknown_model`. | GitHub-side |

**Notes**
- **Embedding models** (`text-embedding-3-*`) work — just call the embeddings API,
  not chat completions.
- **500 errors** are transient; re-run later.
- **`unknown_model`** errors are a GitHub-side inconsistency between the catalog
  and the inference endpoint; nothing your token or code can change.
- **`microsoft/phi-4`** is accessible but can be slow to respond on a cold start
  (it once exceeded a 30s timeout, then answered in <1s on retry).

---

## 5. Quick start (copy-paste)

```python
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.environ["GITHUB_TOKEN"],
    base_url="https://models.github.ai/inference",
    default_query={"api-version": "2024-12-01-preview"},
)

def ask(model: str, prompt: str) -> str:
    # gpt-5 / o-series need max_completion_tokens instead of max_tokens
    reasoning = any(model.split("/")[-1].startswith(p) for p in ("gpt-5", "o1", "o3", "o4"))
    limit_param = "max_completion_tokens" if reasoning else "max_tokens"
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        **{limit_param: 256},
    )
    return resp.choices[0].message.content

print(ask("openai/gpt-4o-mini", "Say hello in one sentence."))
print(ask("openai/gpt-5-mini", "Say hello in one sentence."))
```

---

## 6. Re-running the audit

```bash
python test.py
```

- Prints a timestamped, per-model result to the console.
- Writes a full run log to `model_test.log` (overwritten each run).
- Automatically retries `max_tokens` failures with `max_completion_tokens`.

---

## 7. Vision / Image support

Not every accessible model can read images. "Returns HTTP 200 for an image
payload" is **not** the same as "actually understands the image" — some text-only
models accept the payload without erroring but ignore the image. The models below
were verified by sending a real screenshot and checking that they (a) transcribed
the text (OCR) and (b) answered the question.

### How to send an image
Use the OpenAI-compatible multimodal message format. The image can be a public
URL or a base64 `data:` URI.

```python
resp = client.chat.completions.create(
    model="openai/gpt-4o-mini",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What is in this image?"},
            {"type": "image_url", "image_url": {"url": "data:image/png;base64,<...>"}},
        ],
    }],
    max_tokens=300,  # use max_completion_tokens for gpt-5/o-series
)
```

### Tier 1 — Reliable vision (fast, correct OCR + answer) ✅
Best choice for image workloads.

| Model ID | Approx. latency | Notes |
| -------- | --------------- | ----- |
| `openai/gpt-4o` | ~3s | Strong all-round vision. |
| `openai/gpt-4o-mini` | ~2s | Fast; small models can occasionally miscalculate. |
| `openai/gpt-4.1` | ~5–10s | Accurate. |
| `openai/gpt-4.1-mini` | ~2–4s | |
| `openai/gpt-4.1-nano` | ~2–3s | |
| `meta/llama-4-scout-17b-16e-instruct` | ~2s | |
| `meta/llama-4-maverick-17b-128e-instruct-fp8` | ~2.5s | |
| `mistral-ai/mistral-small-2503` | ~2s | |
| `mistral-ai/mistral-medium-2505` | ~5s | |
| `microsoft/phi-4-multimodal-instruct` | ~2s | Only phi-4 variant with vision. |

### Tier 2 — Vision-capable but slow (reasoning models) ⚠️
Support images but spend time/tokens on internal reasoning. Give them a large
`max_completion_tokens` (e.g. 800) or they may return an empty string.

| Model ID | Approx. latency | Notes |
| -------- | --------------- | ----- |
| `openai/gpt-5`, `gpt-5-chat`, `gpt-5-mini` | ~3–6s | |
| `openai/gpt-5-nano` | ~28s | Very slow. |
| `openai/o1` | ~38s | Very slow. |
| `openai/o3`, `openai/o4-mini` | ~5–7s | |

### Not reliable for images 🚫
Accept the payload without error but **do not read the image** (text-only):
`openai/gpt-4.1-nano` may hedge, `meta/llama-3.3-70b-instruct`,
`deepseek/deepseek-r1`.

Reject images outright: `openai/o3-mini`, `cohere/cohere-command-a`,
`mistral-ai/codestral-2501`, `mistral-ai/ministral-3b`, `microsoft/phi-4`,
`microsoft/phi-4-mini-instruct`, `microsoft/phi-4-mini-reasoning`,
`microsoft/phi-4-reasoning`.

> **OCR vs. reasoning:** in testing, *all* vision models transcribed the text
> perfectly, but the smaller ones (`gpt-4o-mini`, `phi-4-multimodal`)
> occasionally got the *math* wrong. If the answer must be correct (not just
> the text read), prefer a Tier 1 full-size model or a Tier 2 reasoning model.

### Testing images yourself
```bash
python test_vision.py      # which models accept image input (broad scan)
python test_image_qa.py    # OCR + answer a real screenshot (question.png)
```
- `test_image_qa.py` reads `question.png` (or `$env:IMAGE_PATH`), asks each model
  to transcribe and answer, and can auto-grade against `EXPECTED_ANSWER`.
- Logs go to `vision_test.log` and `image_qa.log`.
