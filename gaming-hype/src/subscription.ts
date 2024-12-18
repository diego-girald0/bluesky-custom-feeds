import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return

    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)

    // Update the filter to match gaming-related keywords
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        const text = create.record.text.toLowerCase();
        const keywords = ['trailer', 'dlc', 'release', 'game', 'update']; // Add more as needed
        const matches = keywords.some((keyword) => text.includes(keyword));

        // Log only matching posts
        if (matches) {
          console.log('Matching post text:', text);
        }

        return matches;
      })
      .map((create) => {
        // Map the filtered posts to a database row, including the text
        const postRow = {
          uri: create.uri,
          cid: create.cid,
          indexedAt: new Date().toISOString(),
          text: create.record.text,  // Storing the text field
        };

        // Log the post added to the DB
        console.log('Post added to DB:', [postRow]);

        return postRow;
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }

    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing()) // Prevent duplicate entries based on 'uri'
        .execute()
    }
  }
}
