export async function fetchCopilot(
  payload: {
    message: string;
    context?: Record<string, any>;
    mode?: string;
    history?: Array<{ sender: string; text: string }>;
  },
  timeoutMs = 18000
): Promise<{ success?: boolean; reply?: string; model?: string; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/gemini/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      throw new Error(data.error || 'Server error communicating with Copilot.');
    }

    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error(
        `AI request timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again with a shorter inquiry.`
      );
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
