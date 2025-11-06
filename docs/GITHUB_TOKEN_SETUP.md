# GitHub Token Setup Guide

## Problem
Your GitHub token is not able to access the pull requests in your repository. This causes a 404 error when the app tries to fetch PR details.

## Solution

### Option 1: Fine-grained Personal Access Token (Recommended)

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens?type=beta
   - Click "Generate new token" (Fine-grained)

2. **Configure the Token**
   - **Token name**: `PR-Review-AI` (or any name you prefer)
   - **Expiration**: Choose appropriate duration (90 days recommended)
   - **Repository access**: Select "Only select repositories"
   - Choose your repository: `k18-DEI-AatmaNirbhar`

3. **Set Repository Permissions**
   Under "Repository permissions", set:
   - **Pull requests**: `Read and write` ✅
   - **Contents**: `Read-only` ✅
   - **Issues**: `Read and write` ✅ (needed to post comments)
   - **Metadata**: `Read-only` ✅ (automatically included)

4. **Generate and Copy Token**
   - Click "Generate token"
   - Copy the token (you won't be able to see it again!)

5. **Update Your .env File**
   ```bash
   GITHUB_TOKEN=github_pat_YOUR_NEW_TOKEN_HERE
   ```

### Option 2: Classic Personal Access Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens/new
   
2. **Configure the Token**
   - **Note**: `PR-Review-AI`
   - **Expiration**: Choose appropriate duration
   - **Select scopes**:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`

3. **Generate and Copy Token**
   - Click "Generate token"
   - Copy the token

4. **Update Your .env File**
   ```bash
   GITHUB_TOKEN=ghp_YOUR_NEW_TOKEN_HERE
   ```

## Verify the Token

After updating your `.env` file, run this command to verify:

```bash
node verify-github-token.js
```

You should see:
```
✅ Token is valid
✅ Successfully accessed PR #38
✅ Successfully fetched X files from PR #38
```

## Common Issues

### Issue: "404 Not Found"
- **Cause**: Token doesn't have access to the repository
- **Fix**: Make sure you selected the correct repository when creating the token

### Issue: "Resource not accessible by personal access token"
- **Cause**: Token doesn't have the required permissions
- **Fix**: Recreate the token with the permissions listed above

### Issue: "Bad credentials"
- **Cause**: Token is invalid or expired
- **Fix**: Create a new token

## Testing

After setting up the token:

1. Restart your application
2. Create a new PR or update an existing one
3. Check the terminal logs - you should see successful PR fetching
4. The AI review should be posted as a comment on your PR

## Security Notes

⚠️ **Important**:
- Never commit your `.env` file to Git
- Keep your token secure
- Use fine-grained tokens with minimal required permissions
- Set an expiration date for your tokens
- Revoke unused tokens

## Need Help?

If you continue to face issues:
1. Check that PR #38 exists and is open
2. Verify the repository name is correct: `Adbhut07/k18-DEI-AatmaNirbhar`
3. Make sure the token hasn't expired
4. Try with a classic token if fine-grained tokens don't work
