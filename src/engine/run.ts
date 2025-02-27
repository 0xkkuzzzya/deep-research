import * as fs from 'fs/promises';
import * as readline from 'readline';

import { deepResearch, writeFinalReport } from './deep-research';
import { generateFeedback } from './feedback';

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Helper function to get user input
function askQuestion(query: string): Promise<string> {
	return new Promise(resolve => {
		rl.question(query, answer => {
			resolve(answer);
		});
	});
}

let query = []

export function AwaitRequest(request: string) {
	query.push(request)
}

// run the agent
async function run(query: string) {
	// Get initial query
	const initialQuery = query;

	// Get breath and depth parameters
	const breadth = 4;
	const depth = 2;

	console.log(`Creating research plan...`);

	// Generate follow-up questions
	const followUpQuestions = await generateFeedback({
		query: initialQuery,
	});

	console.log(
		'\nTo better understand your research needs, please answer these follow-up questions:',
	);

	// Collect answers to follow-up questions
	const answers: string[] = [];
	for (const question of followUpQuestions) {
		const answer = await askQuestion(`\n${question}\nYour answer: `);
		answers.push(answer);
	}

	// Combine all information for deep research
	const combinedQuery = `
Initial Query: ${initialQuery}
Follow-up Questions and Answers:
${followUpQuestions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n')}
`;

	console.log('\nResearching your topic...');

	const { learnings, visitedUrls } = await deepResearch({
		query: combinedQuery,
		breadth,
		depth,
	});

	console.log(`\n\nLearnings:\n\n${learnings.join('\n')}`);
	console.log(`\n\nVisited URLs (${visitedUrls.length}):\n\n${visitedUrls.join('\n')}`);
	console.log('Writing final report...');

	const report = await writeFinalReport({
		prompt: combinedQuery,
		learnings,
		visitedUrls,
	});

	// Save report to file
	await fs.writeFile('output.md', report, 'utf-8');

	console.log(`\n\nFinal Report:\n\n${report}`);
	console.log('\nReport has been saved to output.md');
	rl.close();
}

// run().catch(console.error);
