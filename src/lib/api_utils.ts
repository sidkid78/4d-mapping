export function validateRequest(body: any, requiredFields: string[]) {
    for (const field of requiredFields) {
      if (!(field in body)) {
        return { isValid: false, errorMessage: `Missing required field: ${field}` }
      }
    }
    return { isValid: true, errorMessage: null }
  }