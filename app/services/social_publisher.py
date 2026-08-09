import logging
import os
import json
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SocialPublisher:
    @staticmethod
    def publish_to_x(text: str, rationale: str, source_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Autonomously posts intelligence update to X (Twitter API v2).
        If API keys are configured, sends real API request.
        If keys are absent, executes autonomous simulation mode and logs result.
        """
        api_key = os.getenv("X_API_KEY", "")
        bearer_token = os.getenv("X_BEARER_TOKEN", "")

        # Format concise tweet (max 280 chars)
        obs_text = text.split("\n\n")[0] if "\n\n" in text else text
        # Remove "Observation: " prefix if present for clean tweet
        if obs_text.startswith("Observation:"):
            obs_text = obs_text[12:].strip()

        tweet_body = f"🚀 [Navrachna Intelligence]\n\n{obs_text[:180]}...\n\nRead analysis: {source_url if source_url else 'https://navrachna.ai'}"

        if bearer_token or api_key:
            try:
                headers = {
                    "Authorization": f"Bearer {bearer_token}",
                    "Content-Type": "application/json"
                }
                res = httpx.post("https://api.twitter.com/2/tweets", headers=headers, json={"text": tweet_body}, timeout=10.0)
                if res.status_code == 201:
                    logger.info("✅ Autonomously published post to X (Twitter).")
                    return {"status": "SUCCESS", "platform": "X", "response": res.json()}
                else:
                    logger.warning(f"X API returned status {res.status_code}: {res.text}")
                    return {"status": "FAILED", "platform": "X", "error": res.text}
            except Exception as e:
                logger.error(f"Error during X publishing: {e}")
                return {"status": "ERROR", "platform": "X", "error": str(e)}
        else:
            logger.info(f"🤖 [AUTONOMOUS SIMULATION] X Post Broadcasted:\n{tweet_body}")
            return {"status": "SIMULATED_SUCCESS", "platform": "X", "message": "Broadcasted via Autonomous Social Engine"}

    @staticmethod
    def publish_to_linkedin(text: str, rationale: str, source_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Autonomously posts intelligence entry to LinkedIn.
        If credentials exist, calls LinkedIn UGC API.
        If absent, executes autonomous simulation mode and logs result.
        """
        linkedin_token = os.getenv("LINKEDIN_ACCESS_TOKEN", "")
        author_urn = os.getenv("LINKEDIN_AUTHOR_URN", "")

        post_body = f"🌟 NAVRACHNA AUTONOMOUS INTELLIGENCE\n\n{text}\n\n💡 EDITORIAL RATIONALE:\n{rationale}\n\n🔗 Source: {source_url if source_url else 'https://navrachna.ai'}"

        if linkedin_token and author_urn:
            try:
                headers = {
                    "Authorization": f"Bearer {linkedin_token}",
                    "Content-Type": "application/json",
                    "X-Restli-Protocol-Version": "2.0.0"
                }
                payload = {
                    "author": author_urn,
                    "lifecycleState": "PUBLISHED",
                    "specificContent": {
                        "com.linkedin.ugc.ShareContent": {
                            "shareCommentary": {"text": post_body},
                            "shareMediaCategory": "NONE"
                        }
                    },
                    "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}
                }
                res = httpx.post("https://api.linkedin.com/v2/ugcPosts", headers=headers, json=payload, timeout=10.0)
                if res.status_code == 201:
                    logger.info("✅ Autonomously published post to LinkedIn.")
                    return {"status": "SUCCESS", "platform": "LinkedIn", "response": res.json()}
                else:
                    logger.warning(f"LinkedIn API returned status {res.status_code}: {res.text}")
                    return {"status": "FAILED", "platform": "LinkedIn", "error": res.text}
            except Exception as e:
                logger.error(f"Error during LinkedIn publishing: {e}")
                return {"status": "ERROR", "platform": "LinkedIn", "error": str(e)}
        else:
            logger.info(f"🤖 [AUTONOMOUS SIMULATION] LinkedIn Post Broadcasted:\n{post_body}")
            return {"status": "SIMULATED_SUCCESS", "platform": "LinkedIn", "message": "Broadcasted via Autonomous Social Engine"}
