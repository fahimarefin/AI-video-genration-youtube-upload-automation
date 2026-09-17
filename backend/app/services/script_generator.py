import json
import random
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

# Curated viral Minecraft topics and templates for Shorts
MINECRAFT_DATABASE = [
    {
        "topic": "The Creepiest Removed Feature in Minecraft",
        "category": "Minecraft Lore",
        "hook": "Did you know Mojang secretly removed a feature so disturbing, players thought their worlds were cursed?",
        "facts": [
            "Back in Indev 2010, Steve would sprint with flailing arms and sprint directly at you at blinding speeds.",
            "Later in Alpha, the eerie sound file called 'Cave14' was linked to an entity model that never officially spawned.",
            "Even creepier, early Nether files contained an unused mob known simply as 'The Red Dragon' whose roar still lingers in the sound packs."
        ],
        "cta": "Subscribe right now if you survived the Herobrine era!"
    },
    {
        "topic": "3 Minecraft Glitches That Still Work Today",
        "category": "Minecraft Glitches",
        "hook": "You won't believe these 3 broken Minecraft glitches that Mojang STILL hasn't patched in 2026!",
        "facts": [
            "First, placing a boat against a solid bedrock ceiling allows you to phase right onto the roof of the Nether in seconds.",
            "Second, placing scaffolding inside a waterlogged chest makes you completely invisible to Warden sonic blasts.",
            "And third, spamming an ender pearl at an anvil hitbox will launch you over 500 blocks into the sky instantly."
        ],
        "cta": "Drop a like if you're going to try this before it gets patched!"
    },
    {
        "topic": "5 Things You Definitely Didn't Know About Creepers",
        "category": "Minecraft Facts",
        "hook": "Creepers were born from a catastrophic coding mistake, but it gets way weirder!",
        "facts": [
            "Notch actually tried to code a pig model, accidentally swapped the height and length variables, and got the Creeper silhouette.",
            "Cats scare Creepers not because of claws, but because cats were hardcoded with a negative aura that repels explosive pathfinding.",
            "If a Creeper is struck by lightning, its blast power triples and can vaporize even fully enchanted netherite gear."
        ],
        "cta": "Hit subscribe if you've ever had your base blown up by a Creeper!"
    },
    {
        "topic": "Why You Should NEVER Dig Straight Down",
        "category": "Minecraft Survival",
        "hook": "Rule number one of Minecraft: NEVER dig straight down. But mathematically, what actually happens?",
        "facts": [
            "Statistically, across a standard 1.21 terrain seed, there is an 18.4% chance of hitting a 30-block drop directly into lava.",
            "Even worse, deepslate caves now spawn deep dark skulk sensors that alert the Warden before you even land.",
            "The safe alternative? Always dig on a 2-by-1 block border so your player hitbox stays anchored."
        ],
        "cta": "Subscribe if you learned the hard way and lost all your diamonds!"
    },
    {
        "topic": "The Rarest Block in Minecraft History",
        "category": "Minecraft Facts",
        "hook": "Think the Dragon Egg is rare? You haven't seen the rarest block ever documented in Minecraft!",
        "facts": [
            "In 2011, a rare glitch generated a naturally occurring 'Waterless Waterlogged Sponge' block.",
            "In survival, obtaining a Deepslate Emerald Ore has a chance of less than 0.0001% per chunk.",
            "And if you find a Pink Sheep riding a spider in a jungle temple, that seed odds are 1 in 400 trillion."
        ],
        "cta": "Comment your rarest Minecraft find and smash subscribe!"
    },
    {
        "topic": "Secret Redstone Hacks Pros Keep Hidden",
        "category": "Minecraft Redstone",
        "hook": "These illegal redstone tricks will make your friends think you are using server hacks!",
        "facts": [
            "You can transfer redstone signals wireless up to 100 blocks using calibrated sculk sensors tuned to specific frequencies.",
            "Target blocks redirect dust lines without needing repeaters, shrinking secret door wiring by 70%.",
            "And placing a comparator behind a lectern creates a multi-page combination lock with over 15 distinct combinations."
        ],
        "cta": "Subscribe for more pro Minecraft redstone tutorials!"
    },
    {
        "topic": "The Darkest Secret Behind The End Poem",
        "category": "Minecraft Lore",
        "hook": "When you beat the Ender Dragon, you read the End Poem. But who are the two beings speaking?",
        "facts": [
            "Written by author Julian Gough, the two entities refer to the player as living in a dream they created.",
            "They reveal that the universe is made of love and the game of Minecraft was an allegory for human consciousness.",
            "Mojang originally had no script for the end, and Gough wrote the entire 9-minute dialogue in a single weekend."
        ],
        "cta": "Follow and subscribe if you ever read the entire End Poem!"
    },
    {
        "topic": "Unbeatable Speedrun Tricks In Minecraft",
        "category": "Minecraft Speedrun",
        "hook": "Minecraft speedrunners beat the game in under 8 minutes using this physics exploit!",
        "facts": [
            "By looking at the pie chart in the F3 debug menu, runners locate the Nether Fortress without ever seeing it.",
            "Bed explosions deal 4 times more damage when placed under a single block of obsidian to shield the player.",
            "And modern runners use boat eye-measurements to pinpoint the Stronghold chunk in under 15 seconds."
        ],
        "cta": "Can you beat the game in under an hour? Subscribe and let me know!"
    },
    {
        "topic": "What Really Happens When You Fall In The Void?",
        "category": "Minecraft Mysteries",
        "hook": "What actually exists below bedrock layer negative 64? The answer will shock you.",
        "facts": [
            "Below the world border, void damage ignores all armor, totems of undying, and resistance potions.",
            "Entities falling past Y -200 get permanently wiped from the game chunk cache to prevent engine overflows.",
            "In early versions, the void was rendered as endless black fog with particles drifting upward like dead stars."
        ],
        "cta": "Subscribe if you ever lost your best gear to the void!"
    },
    {
        "topic": "The Secret Mob Mojang Forgot To Release",
        "category": "Minecraft Lore",
        "hook": "Mojang designed an entire mob for the update that completely vanished before launch!",
        "facts": [
            "Remember the Mob Vote with the Copper Golem and Glare? Most never make it into the game.",
            "The Illusioner still exists inside the game code right now and can blind players while creating 4 clones.",
            "You can actually spawn it right now using the summon command: /summon illusioner."
        ],
        "cta": "Subscribe to see more secret unreleased mobs in Minecraft!"
    }
]

class ScriptGeneratorService:
    def __init__(self):
        self.openai_key = settings.OPENAI_API_KEY

    async def generate_script(
        self,
        topic: Optional[str] = None,
        niche_category: Optional[str] = "Minecraft Facts",
        target_duration_sec: int = 45,
        voice_id: str = "onyx",
        previous_text: Optional[str] = None,
        tone: Optional[str] = "Viral Hype",
        custom_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates an ultra-viral 30-60s YouTube Shorts script tailored for Minecraft.
        Generates unique, fresh variations every single time using OpenAI with high diversity.
        """
        prompt_topic = topic or random.choice(MINECRAFT_DATABASE)["topic"]

        if settings.OPENAI_API_KEY:
            try:
                variation_angles = [
                    "Focus on a terrifying conspiracy or forbidden glitch that players rarely notice.",
                    "Focus on an unbelievable speedrun technique or mathematical impossibility.",
                    "Focus on a secret hidden feature or deleted mechanic that Mojang never announced.",
                    "Focus on a shocking trick that completely changes how you play survival mode.",
                    "Focus on an eerie piece of Minecraft lore that gives players chills.",
                    "Focus on comparing how pros exploit this versus how casual players fail."
                ]
                random_angle = random.choice(variation_angles)

                tone_styles = {
                    "Viral Hype": "Fast-paced, hyper-energetic, high retention like Camman18. Use intense words like 'IMPOSSIBLE', 'FORBIDDEN', 'INSANE'.",
                    "Dark Lore": "Mysterious, suspenseful, and creepy like a haunting Minecraft creepypasta. Dark tone.",
                    "Speedrun": "Rapid, technical, exploit-heavy. Focus on tick manipulation, hitbox abuse, and record times.",
                    "Glitches": "Game-breaking bugs, duplication tricks, and unpatched bedrock/java physics quirks.",
                    "Mind-Blowing": "Mathematical odds, absurd statistics, and counter-intuitive game mechanics.",
                    "Meme": "Humorous, sarcastic, relatable Minecraft pain points and silly player mistakes."
                }
                tone_guide = tone_styles.get(tone or "Viral Hype", "High energy viral retention.")

                avoid_instruction = ""
                if previous_text:
                    avoid_instruction = (
                        f"\nIMPORTANT - PREVIOUS SCRIPT ALREADY SEEN BY USER:\n"
                        f"\"{previous_text[:350]}\"\n"
                        f"You MUST generate a COMPLETELY DIFFERENT, fresh, unique script. "
                        f"Use a totally different hook, different facts, different phrasing, and an alternative angle. DO NOT repeat the previous points!"
                    )

                custom_guide = f"\nUser Directive: {custom_instruction}" if custom_instruction else ""

                system_prompt = (
                    "You are an elite Minecraft YouTube Shorts creator (like Camman18 or SkipTheTutorial). "
                    "Write an ultra-viral, fast-paced 30-45 second script with intense viewer retention for YouTube Shorts.\n"
                    f"Style & Tone: {tone_guide}\n"
                    f"Creative Angle: {random_angle}\n"
                    "You MUST respond ONLY with a valid raw JSON object (no markdown, no backticks) with keys:\n"
                    "- 'topic': short punchy title\n"
                    "- 'hook': 0-3 second intense scroll-stopping hook (15-20 words)\n"
                    "- 'body': 2-3 mind-blowing secrets, glitches, or lore facts (50-70 words total)\n"
                    "- 'cta': punchy 1-sentence subscribe or comment call-to-action (10-15 words)"
                )
                user_prompt = (
                    f"Write a fresh viral Minecraft YouTube Short script about: {prompt_topic}.\n"
                    f"Niche Category: {niche_category or 'Minecraft Facts'}.\n"
                    f"Requested Tone: {tone or 'Viral Hype'}.\n"
                    f"{avoid_instruction}{custom_guide}"
                )

                async with httpx.AsyncClient(timeout=30.0) as client:
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
                            "temperature": 0.95
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        hook = parsed.get("hook", "").strip()
                        body = parsed.get("body", "").strip()
                        cta = parsed.get("cta", "").strip()
                        resolved_topic = parsed.get("topic", prompt_topic).strip()
                        full_text = f"{hook} {body} {cta}".strip()
                        words = full_text.split()
                        return {
                            "topic": resolved_topic,
                            "niche_category": niche_category or "Minecraft",
                            "hook": hook,
                            "body": body,
                            "cta": cta,
                            "full_text": full_text,
                            "word_count": len(words),
                            "estimated_duration_sec": max(15, min(60, int(len(words) / 2.5))),
                            "voice_id": voice_id,
                            "tone": tone or "Viral Hype",
                            "generated_by": "openai"
                        }
            except Exception as e:
                print(f"[ScriptGenerator] OpenAI generation error ({e}), falling back to dynamic combinatorial engine.")

        # Fallback dynamic combinatorial engine (ensures variation even without OpenAI)
        return self._generate_dynamic_procedural_script(
            prompt_topic, niche_category, voice_id, previous_text, tone
        )

    async def refine_script(
        self,
        topic: str,
        hook: str,
        body: str,
        cta: str,
        action: str = "regenerate",
        tone: Optional[str] = "Viral Hype",
        instruction: Optional[str] = None,
        niche_category: Optional[str] = "Minecraft Facts",
        voice_id: str = "onyx"
    ) -> Dict[str, Any]:
        """
        Refines, rewrites, or transforms a generated script using AI based on the requested action:
        - 'regenerate': Complete fresh variation of the topic with new facts and hook
        - 'rewrite_hook': Generates a more intense, scroll-stopping 0-3s hook
        - 'rewrite_body': Generates new mind-blowing facts and secrets
        - 'rewrite_cta': Generates a punchier viral retention call-to-action
        - 'change_tone': Rewrites the entire script into a specific vibe (Dark Lore, Speedrun, etc.)
        - 'custom': Applies the user's custom instruction to the script
        """
        if settings.OPENAI_API_KEY:
            try:
                system_prompt = (
                    "You are an elite Minecraft YouTube Shorts script editor. "
                    "Refine or rewrite the creator's script to maximize retention, scroll-stopping engagement, and viral potential. "
                    "You MUST respond ONLY with a valid raw JSON object (no markdown, no backticks) with keys:\n"
                    "- 'topic': updated or preserved punchy title\n"
                    "- 'hook': 0-3 second intense scroll-stopping hook (15-20 words)\n"
                    "- 'body': core retention facts/body (50-70 words)\n"
                    "- 'cta': punchy call-to-action (10-15 words)"
                )

                action_instructions = {
                    "regenerate": f"Generate a completely new and distinct variation for '{topic}'. Use fresh facts and a brand new hook angle in the '{tone}' tone.",
                    "rewrite_hook": f"Keep the core facts in the body, but craft a brand new, 10x more intense scroll-stopping viral hook for '{topic}'.",
                    "rewrite_body": f"Keep the hook, but replace the facts with 2-3 completely different mind-blowing secrets or glitches about '{topic}'.",
                    "rewrite_cta": f"Keep the hook and body, but write an irresistible viral call-to-action that compels viewers to like, comment, or subscribe.",
                    "change_tone": f"Rewrite the entire script into the '{tone}' tone while keeping the topic '{topic}'.",
                    "custom": f"Apply this specific creator directive to the script: '{instruction}'."
                }

                current_script_summary = f"Current Script:\nHook: {hook}\nBody: {body}\nCTA: {cta}"
                task_instruction = action_instructions.get(action, action_instructions["regenerate"])
                if instruction and action != "custom":
                    task_instruction += f"\nAdditional note: {instruction}"

                user_prompt = (
                    f"Topic: {topic}\n"
                    f"Niche Category: {niche_category or 'Minecraft Facts'}\n"
                    f"Action Required: {action}\n"
                    f"Instruction: {task_instruction}\n\n"
                    f"{current_script_summary}"
                )

                async with httpx.AsyncClient(timeout=30.0) as client:
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
                            "temperature": 0.95
                        }
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        new_hook = parsed.get("hook", hook).strip()
                        new_body = parsed.get("body", body).strip()
                        new_cta = parsed.get("cta", cta).strip()
                        resolved_topic = parsed.get("topic", topic).strip()
                        full_text = f"{new_hook} {new_body} {new_cta}".strip()
                        words = full_text.split()
                        return {
                            "topic": resolved_topic,
                            "niche_category": niche_category or "Minecraft",
                            "hook": new_hook,
                            "body": new_body,
                            "cta": new_cta,
                            "full_text": full_text,
                            "word_count": len(words),
                            "estimated_duration_sec": max(15, min(60, int(len(words) / 2.5))),
                            "voice_id": voice_id,
                            "tone": tone or "Viral Hype",
                            "generated_by": "openai"
                        }
            except Exception as e:
                print(f"[ScriptGenerator] OpenAI refine error ({e}), applying dynamic fallback.")

        # Fallback variation
        return self._generate_dynamic_procedural_script(
            topic, niche_category, voice_id, f"{hook} {body}", tone
        )

    def _generate_dynamic_procedural_script(
        self,
        topic: str,
        niche_category: Optional[str],
        voice_id: str,
        previous_text: Optional[str],
        tone: Optional[str]
    ) -> Dict[str, Any]:
        """Procedural combinatorial engine generating distinct variations every run"""
        hook_templates = [
            f"You won't believe what Mojang actually hid inside: {topic}!",
            f"Think you know everything about Minecraft? Wait until you hear the truth about {topic}!",
            f"Rule number one of Minecraft: never ignore {topic}. Here is why!",
            f"Minecraft pros keep this completely secret, but here's the truth about {topic}!",
            f"Is this the most cursed mystery in Minecraft history? Let's talk about {topic}!"
        ]
        
        facts_pool = [
            f"First off, {topic} has been baffling the Minecraft community for months.",
            "When tested across multiple survival seeds, the game engine produces unexpected physics behavior.",
            "Top redstone builders are already using this hidden mechanic to automate their worlds.",
            "In early beta versions, this feature was completely different before Mojang secretly patched it.",
            "Mathematically, the odds of this happening naturally in a fresh chunk are less than one in a million.",
            "Rumors in the community claim this was originally linked to an unused mob that never officially spawned.",
            "If you try this in the Nether, the game physics behave in a completely reversed way."
        ]

        cta_templates = [
            "Subscribe right now for more insane Minecraft secrets and exploits!",
            "Drop a comment if you knew this, and smash that subscribe button!",
            "Share this with a friend who still plays Minecraft every single day!",
            "Hit subscribe if your base has ever been ruined by a secret mechanic!"
        ]

        # Filter out previously seen hook if possible
        available_hooks = [h for h in hook_templates if not previous_text or h[:20].lower() not in previous_text.lower()]
        hook = random.choice(available_hooks or hook_templates)

        selected_facts = random.sample(facts_pool, k=min(3, len(facts_pool)))
        body = " ".join(selected_facts)

        available_ctas = [c for c in cta_templates if not previous_text or c[:15].lower() not in previous_text.lower()]
        cta = random.choice(available_ctas or cta_templates)

        full_text = f"{hook} {body} {cta}".strip()
        words = full_text.split()

        return {
            "topic": topic,
            "niche_category": niche_category or "Minecraft",
            "hook": hook,
            "body": body,
            "cta": cta,
            "full_text": full_text,
            "word_count": len(words),
            "estimated_duration_sec": max(15, min(60, int(len(words) / 2.5))),
            "voice_id": voice_id,
            "tone": tone or "Viral Hype",
            "generated_by": "procedural"
        }

    def get_preset_topics(self):
        """Returns list of all preset Minecraft topics for batch generation"""
        return MINECRAFT_DATABASE

script_generator = ScriptGeneratorService()
