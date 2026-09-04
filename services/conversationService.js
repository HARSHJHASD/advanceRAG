const conversations = new Map();

const MAX_HISTORY_MESSAGES = 10;

export function getConversationHistory(sessionId) {
  return conversations.get(sessionId) || [];
}

export function addMessage(sessionId, role, content) {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }

  const history = conversations.get(sessionId);

  history.push({
    role,
    content,
  });

  // Keep only the most recent messages
  if (history.length > MAX_HISTORY_MESSAGES) {
    conversations.set(
      sessionId,
      history.slice(-MAX_HISTORY_MESSAGES)
    );
  }
}

export function clearConversation(sessionId) {
  conversations.delete(sessionId);
}