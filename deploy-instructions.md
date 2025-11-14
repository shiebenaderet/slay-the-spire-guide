# Deployment Instructions for Slay the Spire Guide

## The Problem
The site is showing a React infinite loop error because it's serving an old build.

## The Solution  
Deploy the latest fixed version from the feature branch.

## Steps to Deploy

### Option 1: Quick Deploy (Recommended)
```bash
git clone https://github.com/shiebenaderet/slay-the-spire-guide.git
cd slay-the-spire-guide
git checkout claude/review-guide-code-011CV3UkKDdzXy46VVgxo3Hj  
npm install
npm run deploy
```

### Option 2: If You Already Have It Cloned
```bash
cd slay-the-spire-guide
git fetch origin
git checkout claude/review-guide-code-011CV3UkKDdzXy46VVgxo3Hj
git pull
npm run deploy
```

### What This Does
- Builds the app with error handling
- Deploys to gh-pages branch
- Updates spireguide.app with the fixed version

## After Deployment
1. Wait 2-3 minutes for GitHub Pages to update
2. Visit spireguide.app
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. If you still see errors, check browser console for detailed logs

## What's Fixed
- Error boundaries to catch crashes
- Console logging to identify issues
- Prevents blank screen
- Shows user-friendly error messages
