import requests
import json
import re
import logging
from models import Task, db

logger = logging.getLogger(__name__)

def clean_json_string(raw: str) -> str:
    """
    Remove comments and invalid trailing text from Ollama output.
    """
    raw = re.sub(r'//.*', '', raw) # Remove JS-style comments
    raw = re.sub(r',\s*([\]}])', r'\1', raw) # Remove trailing commas before closing brackets/braces
    return raw.strip()


def extract_tasks(parsed_data):
    """
    Normalize AI JSON into a list of tasks/subtasks.
    Supports multiple shapes:
    - {"project": {"tasks": [...]}}
    - {"tasks": [...]}
    - {"subtasks": [...]}
    - top-level list
    """
    if isinstance(parsed_data, dict):
        if "project" in parsed_data and isinstance(parsed_data["project"], dict):
            return parsed_data["project"].get("tasks", [])
        if "tasks" in parsed_data:
            return parsed_data.get("tasks", [])
        if "subtasks" in parsed_data:
            return parsed_data.get("subtasks", [])
    elif isinstance(parsed_data, list):
        return parsed_data
    return []

def generate_plan_from_ai(prompt: str, goal_id: int, parent_id=None, ollama_api_url: str = "http://ollama:11434") -> list[Task]:
    """Call AI API, parse JSON, and create Task objects (not yet committed)."""
    # call api
    try:
        response = requests.post(
            f"{ollama_api_url}/v1/completions",
            json={
                "model": "mistral:latest",
                "prompt": prompt.strip(),
                "temperature": 0.2,
                "max_tokens": 512
            },
            timeout=120
        )
    except Exception as e:
        raise RuntimeError(f"Failed to call Ollama: {e}") from e

    if response.status_code != 200:
        raise RuntimeError(f"AI API returned status {response.status_code}")

    # parse json and return task list
    try:
        data = response.json()
        raw_output = data.get("choices", [{}])[0].get("text", "").strip()
        if not raw_output:
            raise ValueError("Empty AI response")

        start = raw_output.find("{")
        end = raw_output.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON found in AI output")

        json_str = raw_output[start:end]

        logging.debug('JSON STR %s', json_str)

        parsed_data = json.loads(clean_json_string(json_str))
        task_list = extract_tasks(parsed_data)

        tasks = []
        for idx, t in enumerate(task_list):
            task = Task(
                title=t.get("title", "Untitled"),
                description=t.get("description", ""),
                goal_id=goal_id,
                parent_id=parent_id,
                order_idx=idx
            )
            tasks.append(task)
        return tasks
    except Exception as e:
        logger.exception("Error parsing AI output")
        raise RuntimeError(f"Failed to parse AI output: {e}") from e