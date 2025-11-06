import 'dotenv/config';
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function verifyToken() {
  try {
    console.log('Verifying GitHub token...\n');

    // Check if token is set
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN is not set in .env file');
      process.exit(1);
    }

    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();
    console.log('✅ Token is valid');
    console.log(`   Authenticated as: ${user.login}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Type: ${user.type}\n`);

    // Try to access a specific PR (update with your repo details)
    const owner = 'Adbhut07'; // Update this
    const repo = 'k18-DEI-AatmaNirbhar'; // Update this
    const prNumber = 38; // Update this

    console.log(`Testing access to PR #${prNumber} in ${owner}/${repo}...`);
    
    try {
      const { data: pr } = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });
      console.log(`✅ Successfully accessed PR #${prNumber}`);
      console.log(`   Title: ${pr.title}`);
      console.log(`   State: ${pr.state}`);
      console.log(`   Author: ${pr.user.login}\n`);

      // Try to get PR files
      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
      });
      console.log(`✅ Successfully fetched ${files.length} files from PR #${prNumber}`);
      files.forEach(file => {
        console.log(`   - ${file.filename} (${file.status})`);
      });
    } catch (error) {
      console.error(`❌ Failed to access PR #${prNumber}:`);
      console.error(`   Status: ${error.status}`);
      console.error(`   Message: ${error.message}`);
      console.error('\nPossible issues:');
      console.error('1. The PR number might be incorrect');
      console.error('2. The repository might be private and the token lacks access');
      console.error('3. The token might not have "pull_requests: read" permission');
      console.error('4. The repository owner or name might be incorrect');
      
      console.log('\n💡 To fix this:');
      console.log('1. Go to https://github.com/settings/tokens');
      console.log('2. Create a new Fine-grained personal access token');
      console.log('3. Grant repository access to your repository');
      console.log('4. Enable these permissions:');
      console.log('   - Pull requests: Read and write');
      console.log('   - Contents: Read-only');
      console.log('   - Metadata: Read-only (automatically included)');
      console.log('5. Copy the token and update GITHUB_TOKEN in your .env file');
    }
  } catch (error) {
    console.error('❌ Token verification failed:');
    console.error(`   ${error.message}`);
    console.log('\nMake sure your GITHUB_TOKEN is valid and not expired.');
  }
}

verifyToken();
