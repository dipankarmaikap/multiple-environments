import type { APIRoute } from 'astro';
import { migrateComponents } from '~/lib/components';
import { migrateDatasources } from '~/lib/datasource';
import { createResponse, getFromStorylok } from '~/lib/helper';

export const POST: APIRoute = async ({ request }) => {
  try {
    const acessToken = import.meta.env.STORYBLOK_PERSONAL_ACESS_TOKEN;
    if (!acessToken) {
      return createResponse('STORYBLOK_PERSONAL_ACESS_TOKEN is Missing.', 401);
    }
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const secret = searchParams.get('secret');
    if (secret !== 'supersecret') {
      return createResponse('The request lacks valid credentials.', 401);
    }
    const fromSpace = Number(searchParams.get('from'));
    const toSpace = Number(searchParams.get('to'));
    if (isNaN(fromSpace) || isNaN(toSpace)) {
      return createResponse('The request lacks valid inputs.', 400);
    }

    // await migrateDatasources(fromSpace, toSpace);
    await migrateComponents(fromSpace, toSpace);

    // Perform operations with `fromSpace` and `toSpace`
    //Application Code goes here

    //Sync Data source
    //Sync Components
    //Sync Published Stories.

    return createResponse('Success!', 200);
  } catch (error) {
    console.error('Error processing request:', error);
    return createResponse('Internal Server Error', 500);
  }
};
