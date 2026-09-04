import { evaluationCases } from "../data/evaluationCases.js";
import { askRAG } from "../services/ragService.js";

let hits = 0;

for (const testCase of evaluationCases) {
  const result = await askRAG(
    testCase.question,
    testCase.topic,
    `evaluation-${testCase.id}`
  );

  const sourceIds = result.sources.map(
    (source) => source.metadata?.sourceId
  );
  const passed = sourceIds.includes(testCase.expectedSourceId);
  hits += Number(passed);

  console.log(JSON.stringify({
    id: testCase.id,
    passed,
    expectedSourceId: testCase.expectedSourceId,
    sourceIds,
  }));
}

const recallAt3 = hits / evaluationCases.length;

console.log(JSON.stringify({
  metric: "retrieval_recall_at_3",
  value: recallAt3,
  totalCases: evaluationCases.length,
}));

if (recallAt3 < 1) {
  process.exitCode = 1;
}
