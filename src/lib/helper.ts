const acessToken = import.meta.env.STORYBLOK_PERSONAL_ACESS_TOKEN;

const getFromStorylok = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: acessToken,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch data from ${url}: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};
const addToStorylok = async (url: string, body: any, method?: string) => {
  try {
    const addResponse = await fetch(url, {
      method: method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: acessToken,
      },
      body: JSON.stringify(body),
    });

    if (!addResponse.ok) {
      console.error(`Failed to add entry: ${addResponse.statusText}`);
    }
    // Check for empty body or non-JSON responses
    const contentType = addResponse.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      console.log('Operation Sucessfull for your ' + method + ' method');
      return null;
    }
    return await addResponse.json();
  } catch (error) {
    console.error(`Error adding entry: ${error.message}`);
  }
};
const createResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ message }), { status });
};

export { addToStorylok, getFromStorylok, createResponse };
