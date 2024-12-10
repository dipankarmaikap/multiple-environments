import FormData from 'form-data';
import { addToStorylok } from './helper';

async function uploadFileToStoryblok(
  fileUrl: string,
  spaceID: number,
  metaDatas: any
) {
  if (!fileUrl) {
    return;
  }
  let splitFile = fileUrl?.split('/');
  let fileName = splitFile[splitFile.length - 1];
  try {
    const data = await addToStorylok(
      `https://mapi.storyblok.com/v1/spaces/${spaceID}/assets/`,
      {
        filename: fileName,
        size: splitFile[6] || '400x500',
      }
    );

    let fetchImage = await fetch(fileUrl);
    let imgBuffer = Buffer.from(await fetchImage.arrayBuffer());
    await fileUpload(data, imgBuffer);
    let filename = `https://a.storyblok.com/${data.fields.key}`;
    return {
      ...metaDatas,
      filename,
      id: data.id,
    };
  } catch (error) {
    console.log(error.message);
  }
}
async function fileUpload(signed_request, file) {
  const form = new FormData();
  for (let key in signed_request.fields) {
    form.append(key, signed_request.fields[key]);
  }
  form.append('file', file);
  form.submit(signed_request.post_url, function (err, res) {
    if (err) throw err;
  });
}
export { uploadFileToStoryblok };
