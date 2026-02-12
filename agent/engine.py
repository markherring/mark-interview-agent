"""
Mark's Interview Agent - Core Engine

This module handles:
1. Loading context from markdown files (identity, company info, standard answers)
2. Assembling the system prompt
3. Calling the Claude API
"""
# Add this at the top of engine.py
from dotenv import load_dotenv
load_dotenv()  # This loads .env automatically

import os
from pathlib import Path
from typing import Dict, List
import anthropic


class ContextLoader:
    """Loads all context files from core/ and companies/ directories"""

    def __init__(self, base_dir: str = None):
        if base_dir is None:
            # Default to parent directory of agent/
            self.base_dir = Path(__file__).parent.parent
        else:
            self.base_dir = Path(base_dir)

        self.core_dir = self.base_dir / "core"
        self.companies_dir = self.base_dir / "companies"
        self.agent_dir = self.base_dir / "agent"

    def load_identity(self) -> str:
        """Load core/identity.md"""
        identity_file = self.core_dir / "identity.md"
        if identity_file.exists():
            return identity_file.read_text(encoding='utf-8')
        return "[Identity file not found]"

    def load_standard_answers(self) -> str:
        """Load all files from core/standard_answers/"""
        answers_dir = self.core_dir / "standard_answers"
        if not answers_dir.exists():
            return "[No standard answers found]"

        answers = []
        for md_file in sorted(answers_dir.glob("*.md")):
            # Skip template and README files
            if md_file.name.startswith('_') or md_file.name == 'README.md':
                continue

            content = md_file.read_text(encoding='utf-8')
            answers.append(f"\n{'='*60}\n{content}\n{'='*60}\n")

        return "\n".join(answers) if answers else "[No standard answers found]"

    def load_company_context(self, company_name: str) -> str:
        """Load companies/{company_name}.md"""
        company_file = self.companies_dir / f"{company_name}.md"
        if company_file.exists():
            return company_file.read_text(encoding='utf-8')
        return f"[Company context file not found: {company_name}]"

    def load_system_prompt_template(self) -> str:
        """Load agent/system_prompt.md"""
        prompt_file = self.agent_dir / "system_prompt.md"
        if prompt_file.exists():
            return prompt_file.read_text(encoding='utf-8')
        return "[System prompt template not found]"

    def list_available_companies(self) -> List[str]:
        """List all available company context files"""
        if not self.companies_dir.exists():
            return []

        companies = []
        for md_file in self.companies_dir.glob("*.md"):
            # Remove .md extension and add to list
            companies.append(md_file.stem)

        return sorted(companies)


class InterviewAgent:
    """Main agent that assembles prompts and calls Claude"""

    def __init__(self, api_key: str = None, base_dir: str = None):
        """
        Initialize the interview agent

        Args:
            api_key: Anthropic API key (if None, reads from ANTHROPIC_API_KEY env var)
            base_dir: Base directory for the project (defaults to parent of agent/)
        """
        self.loader = ContextLoader(base_dir)

        # Initialize Claude client (will be None if no API key)
        if api_key is None:
            api_key = os.environ.get('ANTHROPIC_API_KEY')

        self.client = anthropic.Anthropic(api_key=api_key) if api_key else None
        self.conversation_history = []

    def load_context(self, company_name: str) -> Dict[str, str]:
        """Load all context for a specific company"""
        return {
            'identity': self.loader.load_identity(),
            'company_context': self.loader.load_company_context(company_name),
            'standard_answers': self.loader.load_standard_answers(),
            'system_prompt_template': self.loader.load_system_prompt_template(),
            'company_name': company_name
        }

    def build_system_prompt(self, context: Dict[str, str]) -> str:
        """Assemble the final system prompt with all context injected"""
        template = context['system_prompt_template']

        # Replace placeholders in template
        system_prompt = template.replace('{COMPANY_NAME}', context['company_name'].replace('_', '.').title())
        system_prompt = system_prompt.replace('{IDENTITY}', context['identity'])
        system_prompt = system_prompt.replace('{COMPANY_CONTEXT}', context['company_context'])
        system_prompt = system_prompt.replace('{STANDARD_ANSWERS}', context['standard_answers'])

        # Add tone guidance based on company (can be expanded later)
        tone_guidance = "Maintain Mark's direct, candid style while showing genuine interest in the company's mission and technical challenges."
        system_prompt = system_prompt.replace('{TONE_GUIDANCE}', tone_guidance)

        return system_prompt

    def start_conversation(self, company_name: str):
        """Start a new conversation for a specific company"""
        self.conversation_history = []
        self.current_company = company_name
        self.context = self.load_context(company_name)
        self.system_prompt = self.build_system_prompt(self.context)

        # Add coaching message with response constraints
        self.conversation_history.append({
            "role": "user",
            "content": "CRITICAL INSTRUCTIONS: Keep ALL responses 250-400 words max. Each bullet point = 2-3 sentences only (not paragraphs). NEVER add 'What Excites Me About [Company]' or 'For [Company] specifically' sections at the end - just answer the question and stop. Never mention '30+ years'. Follow these rules strictly."
        })
        self.conversation_history.append({
            "role": "assistant",
            "content": "Got it. Tight answers with 2-3 sentence bullets. I'll answer the question directly without adding company-specific sections at the end."
        })

    def send_message(self, user_message: str, stream: bool = False) -> str:
        """
        Send a message to the agent and get a response

        Args:
            user_message: The interviewer's question
            stream: Whether to stream the response (for CLI)

        Returns:
            The agent's response as Mark
        """
        if not self.client:
            return "[ERROR: No API key configured. Set ANTHROPIC_API_KEY environment variable.]"

        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        try:
            # Call Claude API
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",  # Latest Sonnet model
                max_tokens=1200,
                system=self.system_prompt,
                messages=self.conversation_history
            )

            # Extract response text
            assistant_message = response.content[0].text

            # Add to conversation history
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message
            })

            return assistant_message

        except Exception as e:
            return f"[ERROR calling Claude API: {str(e)}]"

    def get_available_companies(self) -> List[str]:
        """Get list of available companies"""
        return self.loader.list_available_companies()


if __name__ == "__main__":
    # Quick test
    agent = InterviewAgent()
    companies = agent.get_available_companies()
    print(f"Available companies: {companies}")

    if companies:
        context = agent.load_context(companies[0])
        print(f"\nLoaded context for {companies[0]}:")
        print(f"- Identity: {len(context['identity'])} chars")
        print(f"- Company context: {len(context['company_context'])} chars")
        print(f"- Standard answers: {len(context['standard_answers'])} chars")
