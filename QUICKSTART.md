# Quick Start - Get Running in 5 Minutes

## 1. Get an API Key (2 minutes)

1. Go to https://console.anthropic.com/settings/keys
2. Click "Create Key"
3. Copy the key (starts with `sk-ant-api03-`)

## 2. Set Up Environment (1 minute)

```bash
cd mark-interview-agent

# Create .env file
cp .env.example .env

# Edit .env and paste your API key
# You can use any text editor - nano, vim, or VS Code
nano .env
```

Your `.env` should look like:
```
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ACTUAL-KEY-HERE
```

## 3. Install Dependencies (1 minute)

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install packages
pip install -r requirements.txt
```

## 4. Customize Your Content (30 seconds)

**Must edit:**
- `core/identity.md` - Add your actual background

**Should edit:**
- `companies/kore_ai.md` - Add role target and contacts
- `companies/descript.md` - Add role target and contacts

**Can wait:**
- Standard answers (already has brand_strategy.md as example)
- Writing samples (optional)

## 5. Run It! (30 seconds)

```bash
cd agent
python cli.py
```

Select a company and start testing!

## First Test Questions

Try these to verify it works:

1. "Why are you interested in Kore.ai?" (or Descript)
2. "How do you approach brand strategy?"
3. "Tell me about your technical background"

## What to Expect

✅ **Working correctly:**
- Responses use "I" statements
- Mentions specific companies from your background
- Blends company research naturally
- Sounds conversational, not robotic

❌ **Needs tuning:**
- Too generic (add more to identity.md)
- Doesn't mention company specifics (check company file loaded)
- Sounds like a bot (adjust system_prompt.md tone)

## Next Steps

Once basic testing works:

1. **Add more standard answers** - Copy `_template.md` in `core/standard_answers/`
2. **Add more companies** - Copy `kore_ai.md` template
3. **Refine tone** - Edit `agent/system_prompt.md`
4. **Practice real questions** - See TESTING_GUIDE.md for full list

## Troubleshooting

**"No module named 'anthropic'"**
```bash
pip install -r requirements.txt
```

**"No API key configured"**
- Make sure `.env` file exists (not `.env.example`)
- Check API key has no spaces/quotes around it
- Key should start with `sk-ant-api03-`

**"No company context files found"**
- Make sure you're in the right directory
- Check `companies/` folder has `.md` files

## Getting Help

Check README.md for full documentation.

---

**You're ready! Start testing and iterate from there.** 🚀
