import json
import random
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

class SEOService:
    def __init__(self):
        self.emojis = ["😱", "🔥", "⚡", "🤯", "💀", "⛏️", "👀"]
        self.default_hashtags = ["#shorts", "#minecraft", "#gaming", "#minecraftfacts", "#minecraftshorts"]

    async def generate_seo(self, topic: str, niche_category: str = "Minecraft", hook: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates algorithm-optimized title variants, description, and hashtags for YouTube Shorts.
        Uses OpenAI (gpt-4o-mini) when OPENAI_API_KEY is configured.
        """
        if settings.OPENAI_API_KEY:
            try:
                system_prompt = (
                    "You are a YouTube Shorts SEO algorithm expert specializing in the Minecraft niche. "
                    "Generate high-CTR title variations (with emojis and #shorts), an algorithm-optimized description, "
                    "and 12-15 comma-separated viral tags. "
                    "Respond ONLY with a valid JSON object with keys: 'title', 'title_variants' (list of 3 strings), "
                    "'description' (engaging description with call-to-action and hashtags), 'tags' (comma-separated string), 'hashtags' (list of hashtags)."
                )
                user_prompt = f"Generate YouTube Shorts SEO for Minecraft video about: '{topic}'. Niche: '{niche_category}'. Opening hook: '{hook or topic}'."

                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        "https://api.openai.com/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "gpt-4o-mini",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            "response_format": {"type": "json_object"},
                            "temperature": 0.7
                        }
                    )
                    if resp.status_code == 200:
                        parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                        return {
                            "title": parsed.get("title", f"{topic} 😱 #shorts"),
                            "title_variants": parsed.get("title_variants", [f"{topic} 😱 #shorts"]),
                            "description": parsed.get("description", ""),
                            "tags": parsed.get("tags", "minecraft, shorts, gaming"),
                            "hashtags": parsed.get("hashtags", self.default_hashtags),
                            "generated_by": "openai"
                        }
            except Exception as e:
                print(f"[SEOService] OpenAI SEO generation note ({e}), falling back to template.")

        # Fallback template
        emoji = random.choice(self.emojis)
        title_variants = [
            f"You WON'T Believe This Minecraft Secret... {emoji} #shorts",
            f"I Bet You Didn't Know THIS About Minecraft! 🤯 #shorts",
            f"{topic} {emoji} (DO NOT TRY THIS) #shorts"
        ]
        selected_title = title_variants[0]

        description = f"""🔥 {topic} - Mind-blowing Minecraft Shorts!

Can you believe this actually exists in Minecraft? Test it in your world and drop a comment below with what happened!

👉 SUBSCRIBE for 10 daily Minecraft secrets, speedrun hacks, and insane glitches!
🔔 Turn on notifications so you never miss an upload!

#shorts #minecraft #gaming #minecraftfacts #minecraftglitches #minecraftmemes #mcyt #terryharris
"""

        tags_list = [
            "minecraft", "minecraft shorts", "minecraft facts", "minecraft secrets",
            "minecraft glitches", "gaming", "minecraft 1.21", "mcyt", "shorts",
            "speedrun", "minecraft tutorial", "survival tips"
        ]

        return {
            "title": selected_title,
            "title_variants": title_variants,
            "description": description,
            "tags": ", ".join(tags_list),
            "hashtags": self.default_hashtags
        }

seo_service = SEOService()
