import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

export const shortname = 'gaming-hype'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  // Define the keywords for filtering posts
  const keywords = ['trailer', 'dlc', 'release', 'game', 'update']

  // Fetch posts from the database without inserting new ones
  let builder = ctx.db
    .selectFrom('post')
    .selectAll()  // Select all columns, including the 'text' field
    .orderBy('indexedAt', 'desc')
    .limit(1000)  // You can adjust this limit based on how many posts you want to fetch

  // Handle cursor for pagination (if provided)
  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString()
    builder = builder.where('post.indexedAt', '<', timeStr)
  }

  // Execute the query and fetch the posts
  const res = await builder.execute()

  // Filter posts based on the keywords in the 'text' field
  const filteredPosts = res.filter((row) => {
    const text = row.text?.toLowerCase() || '';  // Safely check for 'text' field
    return keywords.some((keyword) => text.includes(keyword))  // Check if any keyword matches
  })

  // Log the filtered posts for debugging
  console.log('Filtered Posts:', filteredPosts)  // This will show the filtered posts

  // Format the posts for the feed response
  const feed = filteredPosts.map((row) => ({
    post: row.uri,
  }))

  // Generate the cursor for pagination
  let cursor: string | undefined
  const last = res.at(-1)
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString(10)
  }

  // Return the filtered posts along with the cursor
  return { cursor, feed }
}
