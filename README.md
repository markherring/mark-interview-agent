# Mark's Interview Agent

An AI agent that represents Mark Herring in interview contexts. Interviewers can ask questions and get authentic, personalized responses based on Mark's background, tailored to specific companies.

## What This Does

- **Personalized responses**: Answers interview questions as Mark would, using his real experience and communication style
- **Company-specific**: Tailors responses based on research about the target company
- **Authentic voice**: Direct, candid, example-driven - not generic chatbot responses
- **Reusable answers**: Standard STAR-formatted responses that work across companies
- **Easy to extend**: Add new companies in seconds, add new standard answers anytime

## Architecture (Simplified)

```
mark-interview-agent/
├── core/                          # Mark's identity (reusable across companies)
│   ├── identity.md                # Background, skills, values, style
│   ├── standard_answers/          # STAR-formatted responses to common questions
│   │   ├── brand_strategy.md      # How Mark approaches brand/positioning
│   │   └── _template.md           # Template for adding new answers
│   └── writing_samples/           # (optional) Examples of Mark's writing
│
├── companies/                     # Lightweight context per company (1 page each)
│   ├── kore_ai.md                 # What Kore.ai does + why Mark is excited
│   └── descript.md                # What Descript does + why Mark is excited
│
├── agent/                         # The engine
│   ├── engine.py                  # Loads context + calls Claude API
│   ├── cli.py                     # Terminal chatbot
│   └── system_prompt.md           # Master prompt template
│
├── requirements.txt
├── .env.example
└── README.md
```

**Key principle:** Standard answers are in `core/`, company customization is lightweight. The agent blends them together.

## Quick Start

### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 2. Set Up API Key

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Anthropic API key
# Get key from: https://console.anthropic.com/settings/keys
```

### 3. Customize Your Content

1. **Edit `core/identity.md`**: Add your background, skills, career goals
2. **Add standard answers**: Copy `core/standard_answers/_template.md` to create new responses
3. **Update company files**: Customize `companies/kore_ai.md` and `companies/descript.md`

### 4. Run the CLI

```bash
cd agent
python cli.py
```

You'll be prompted to select a company, then you can start asking interview questions!

## Usage Examples

### CLI Mode

```
$ python agent/cli.py

============================================================
  MARK'S INTERVIEW AGENT - CLI
============================================================

Available companies:
  1. Descript
  2. Kore.Ai

Select company (enter number): 1

✓ Loading context for Descript...
✓ Agent ready! You are now interviewing Mark for Descript

------------------------------------------------------------
INTERVIEWER: Why are you interested in Descript?

------------------------------------------------------------
MARK: I love what you're doing with text-based video editing.
The core insight - that editing video should be as simple as
editing a document - is brilliant. You've abstracted away the
complexity without losing power, which is really hard to do...

[continues with personalized response]
```

### Available Commands in CLI

- `/help` - Show available commands
- `/context` - Show loaded context summary
- `/prompt` - Show the full system prompt being sent to Claude
- `/quit` - Exit

## Adding Content

### Add a New Company

1. Create a new file: `companies/new_company.md`
2. Use this structure:

```markdown
# Company Name - Company Context

## Company Overview
[What they do, their products]

## Why Mark is Excited
[Specific reasons Mark is interested]

## Key Talking Points
- "Point about their tech that connects to Mark's background"
- "Another relevant connection"

## Role Target
[The role Mark is targeting]
```

3. Run the CLI - your new company will appear in the list!

### Add a New Standard Answer

1. Copy the template: `cp core/standard_answers/_template.md core/standard_answers/your_topic.md`
2. Fill in using STAR format (Situation, Task, Action, Result)
3. The agent will automatically load it

**Suggested topics:**
- Technical challenge you've solved
- Leadership style
- Database architecture decision
- Conflict resolution
- Biggest achievement
- Biggest failure / learning
- Why you're looking for a new role

## How It Works

1. **Context Loading**: Agent reads your identity, the company context, and all standard answers
2. **Prompt Assembly**: Combines everything into a system prompt for Claude
3. **Conversation**: Interviewer asks a question → Agent responds as Mark → Maintains context throughout
4. **Blending**: Standard answers are customized on-the-fly based on company context

**Example:**
- Question: "How do you approach brand strategy?"
- Agent uses: `standard_answers/brand_strategy.md` + `companies/kore_ai.md`
- Result: Mark's brand philosophy + Kore.ai-specific talking points woven together naturally

## Configuration

Edit `agent/system_prompt.md` to customize:
- How the agent communicates
- Tone guidelines
- What to do/not do
- Edge case handling

## Future Enhancements (Phase 2)

- **Web interface**: Flask app with company-specific URLs (e.g., `/kore-ai`, `/descript`)
- **More standard answers**: Build out a comprehensive answer library
- **Custom tone per company**: Different energy level for startup vs. enterprise
- **Interview analytics**: Track which questions are asked most often

## Troubleshooting

**"No API key configured" error:**
- Make sure you've created `.env` file (copy from `.env.example`)
- Add your Anthropic API key to the `.env` file
- API key should start with `sk-ant-api03-`

**"No company context files found" error:**
- Make sure you have `.md` files in the `companies/` directory
- Check that filenames don't have spaces (use underscores: `kore_ai.md`)

**Agent responses sound generic:**
- Add more specific details to `core/identity.md`
- Make sure standard answers use concrete examples
- Update company files with specific talking points

## Project Philosophy

**Simple > Complex**: This project intentionally avoids over-engineering. It's flat markdown files + Python, not a database with a web framework. Why? Because:

1. **Content goes directly into Claude's context** - no need for DB queries
2. **Easy to edit** - just open a markdown file
3. **Fast to spin up new companies** - copy a file, edit it, done
4. **Version controllable** - track changes with git
5. **Easy to review** - see exactly what the agent knows

**Focus on authenticity**: The goal isn't to pass a Turing test, it's to sound like Mark in a real interview.

## License

Personal project - use however you want.

---

**Built by Mark Herring** | markrherring@gmail.com
