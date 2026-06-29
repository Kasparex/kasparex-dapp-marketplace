/**
 * Read JSON from a fetch Response without throwing opaque SyntaxErrors on empty bodies.
 */
export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`Empty server response (${response.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Invalid server response (${response.status})`);
  }
}
