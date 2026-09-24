import { ApiError } from "./http.ts"

export const SESSION_REJECTED_EVENT = "milenio:session-rejected"

export async function withSessionInvalidation<T>(
  operation: () => Promise<T>,
  invalidate: () => void,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) invalidate()
    throw error
  }
}
