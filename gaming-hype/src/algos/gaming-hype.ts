import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

export const shortname = 'gaming-hype'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  const keywords = ['trailer', 'dlc', 'release', 'game', 'update']

  // Fetch posts from the database
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .limit(500)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
    builder = builder.where('post.indexedAt', '<', timeStr)
  }

  const res = await builder.execute()

  // Log one sample post for debugging
  console.log('Sample Post:', res[0]) // Log the first post to check its structure

  // Filter posts based on keywords (update this logic once we identify the correct field)
  const filteredPosts = res.filter((row) => {
    const placeholderText = `${row.uri} ${row.cid}`.toLowerCase() // Update placeholder
    return keywords.some((keyword) => placeholderText.includes(keyword))
  })

  console.log('Filtered Posts:', filteredPosts) // Log filtered posts for debugging

  // Format the posts for the feed
  const feed = filteredPosts.map((row) => ({
    post: row.uri,
  }))

  // Generate the cursor for pagination
  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString(10)
  }

  return { cursor, feed }
}
