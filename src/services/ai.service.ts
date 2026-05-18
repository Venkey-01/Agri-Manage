import { AIInput, AIOutput, runRuleBasedEngine } from '@/ml/ruleEngine';
import { runTFLiteInference } from '@/ml/tfliteModel';
import { runLocalLLM } from '@/ml/localLLM';
import { useSettingsStore } from '@/store/settingsStore';
import { insertAIDecision } from '@/database/queries';
import { saveAIDecision, auth } from './firebase.service';

export async function getAIDecision(input: AIInput): Promise<AIOutput> {
  const { aiMode } = useSettingsStore.getState();

  let result: AIOutput;

  try {
    if (aiMode === 'local-llm') {
      result = await runLocalLLM(input);
    } else if (aiMode === 'tflite') {
      result = await runTFLiteInference(input);
    } else {
      result = runRuleBasedEngine(input);
    }
  } catch (error) {
    console.warn('AI tier failed, falling back to rule engine:', error);
    result = runRuleBasedEngine(input);
  }

  // Log locally
  insertAIDecision({
    action:         result.action,
    confidence:     result.confidence,
    reason:         result.reason,
    tier:           result.tier,
    duration_min:   result.suggested_duration_minutes,
    next_check_hrs: result.next_check_hours,
  });

  // Sync to Firebase if logged in
  if (auth.currentUser) {
    saveAIDecision(auth.currentUser.uid, result).catch(() => {});
  }

  return result;
}
