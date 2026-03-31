import { StateGraph, END, START } from "@langchain/langgraph";
import { EmailEvaluatorAnnotation, EmailEvaluatorState } from "./state";
import { checkDuplicate } from "./nodes/checkDuplicate";
import { checkSenderReputation } from "./nodes/checkSenderReputation";
import { categorize } from "./nodes/categorize";
import { evaluateUrgency } from "./nodes/evaluateUrgency";
import { storeEmail } from "./nodes/storeEmail";
import { summarize } from "./nodes/summarize";
import { sendWhatsApp } from "./nodes/sendWhatsApp";

// ─── Tier 2: Routers ──────────────────────────────────────────────────────────

function routeAfterDuplicate(state: EmailEvaluatorState): string {
  return state.is_duplicate ? END : "checkSenderReputation";
}

function routeAfterCategory(state: EmailEvaluatorState): string {
  return state.category === "spam" ? "storeEmail" : "evaluateUrgency";
}

function routeAfterUrgency(state: EmailEvaluatorState): string {
  const threshold = Number(process.env.URGENCY_THRESHOLD ?? 7);
  return state.urgency_score >= threshold ? "summarize" : "storeEmail";
}

function routeAfterStore(state: EmailEvaluatorState): string {
  return state.summary ? "sendWhatsApp" : END;
}

// ─── Graph Assembly ───────────────────────────────────────────────────────────

export function buildEmailEvaluatorGraph() {
  const graph = new StateGraph(EmailEvaluatorAnnotation)
    .addNode("checkDuplicate", checkDuplicate)
    .addNode("checkSenderReputation", checkSenderReputation)
    .addNode("categorize", categorize)
    .addNode("evaluateUrgency", evaluateUrgency)
    .addNode("storeEmail", storeEmail)
    .addNode("summarize", summarize)
    .addNode("sendWhatsApp", sendWhatsApp)

    .addEdge(START, "checkDuplicate")
    .addConditionalEdges("checkDuplicate", routeAfterDuplicate, {
      checkSenderReputation: "checkSenderReputation",
      [END]: END,
    })
    .addEdge("checkSenderReputation", "categorize")
    .addConditionalEdges("categorize", routeAfterCategory, {
      storeEmail: "storeEmail",
      evaluateUrgency: "evaluateUrgency",
    })
    .addConditionalEdges("evaluateUrgency", routeAfterUrgency, {
      summarize: "summarize",
      storeEmail: "storeEmail",
    })
    .addEdge("summarize", "storeEmail")
    .addConditionalEdges("storeEmail", routeAfterStore, {
      sendWhatsApp: "sendWhatsApp",
      [END]: END,
    })
    .addEdge("sendWhatsApp", END);

  return graph.compile();
}
