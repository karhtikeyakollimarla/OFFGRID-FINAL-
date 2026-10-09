"""
Nagrik n8n Automation Dispatcher.
Dispatches asynchronous civic grievance lifecycle events to configured n8n workflows.
Gracefully degrades with zero workflow interruption if n8n is absent or temporarily unreachable.
"""

import logging
import json
from typing import Dict, Any, Optional
import httpx

from .config import N8N_WEBHOOK_URL, N8N_WEBHOOK_SECRET

logger = logging.getLogger("nagrik.n8n_service")

def dispatch_n8n_event_sync(event_type: str, complaint_data: Dict[str, Any]):
    """
    Synchronous dispatcher meant to run inside FastAPI BackgroundTasks.
    Non-blocking to the main HTTP request cycle.
    """
    if not N8N_WEBHOOK_URL:
        logger.debug(f"n8n webhook URL unconfigured. Skipping event '{event_type}'.")
        return

    headers = {
        "Content-Type": "application/json",
        "X-Nagrik-Event": event_type,
        "User-Agent": "Nagrik-Civic-Core/2.0"
    }
    if N8N_WEBHOOK_SECRET:
        headers["Authorization"] = f"Bearer {N8N_WEBHOOK_SECRET}"
        headers["X-Nagrik-Signature"] = N8N_WEBHOOK_SECRET

    payload = {
        "event": event_type,
        "complaint": complaint_data
    }

    try:
        with httpx.Client(timeout=3.5) as client:
            response = client.post(N8N_WEBHOOK_URL, json=payload, headers=headers)
            if response.status_code in (200, 201, 202, 204):
                logger.info(f"Successfully dispatched n8n event '{event_type}' (status {response.status_code}).")
            else:
                logger.warning(f"n8n webhook returned non-success code {response.status_code} for event '{event_type}'.")
    except Exception as e:
        logger.warning(f"Optional n8n automation dispatch failed for '{event_type}': {e}. Core flow unaffected.")
