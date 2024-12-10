import { uploadFileToStoryblok } from './assetUpload';
import { addToStorylok, getFromStorylok } from './helper';

interface Story {
  full_slug: string;
  id?: number;
  asset_folder_id?: number;
}
export async function migrateStories(fromSpace: number, toSpace: number) {
  const fromStoriesUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/stories/?is_published=true`;
  const toStoriesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/stories/?is_published=true`;
  const [fromSpaceStoriesResponse, toSpaceStoriesResponse] = await Promise.all([
    getFromStorylok(fromStoriesUrl),
    getFromStorylok(toStoriesUrl),
  ]);
  const fromStories: Story[] = fromSpaceStoriesResponse.stories || [];
  const toStories: Story[] = toSpaceStoriesResponse.stories || [];
  const toStoriesMap = new Map<string, Story>(
    toStories.map((story) => [story.full_slug, story])
  );
  for (const story of fromStories) {
    const toStory = toStoriesMap.get(story.full_slug);
    const fromStoryUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/stories/${story?.id}`;
    const toStoriesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/stories/${toStory?.id}`;
    const fromSpaceStoryResponse = await getFromStorylok(fromStoryUrl);
    const { name, content, slug } = fromSpaceStoryResponse.story;
    const newStory = { name, content, slug };
    if (!toStory) {
      await addToStorylok(
        `https://mapi.storyblok.com/v1/spaces/${toSpace}/stories/`,
        {
          story: newStory,
          publish: 1,
          force_update: 1,
        }
      );
      console.log('Creating story' + story.full_slug);
    } else {
      await addToStorylok(
        toStoriesUrl,
        {
          story: newStory,
          publish: 1,
          force_update: 1,
        },
        'PUT'
      );
      console.log('Updating story' + story.full_slug);
    }
    toStoriesMap.delete(story.full_slug);
  }

  // Remove orphaned Assets
  for (const [, orphanedStory] of toStoriesMap) {
    await addToStorylok(
      `https://mapi.storyblok.com/v1/spaces/${toSpace}/stories/${orphanedStory?.id}`,
      {},
      'DELETE'
    );
    console.log(
      `Removed orphaned story "${orphanedStory.full_slug}" from target space.`
    );
  }
}
