import { CodeReviewClient } from './client'

const codeReviewClient = new CodeReviewClient()

export { codeReviewClient }
export { CodeReviewClient, computeStats } from './client'
export * from './types'

export default codeReviewClient
