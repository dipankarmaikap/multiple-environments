import { uploadFileToStoryblok } from './assetUpload';
import { getFromStorylok } from './helper';

interface Asset {
  filename: string;
  id?: number;
  asset_folder_id?: number;
}
export async function migrateAssets(fromSpace: number, toSpace: number) {
  const fromAssetsUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/assets/`;
  const toAssetsUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/assets/`;
  const [fromSpaceAssetResponse, toSpaceAssetResponse] = await Promise.all([
    getFromStorylok(fromAssetsUrl),
    getFromStorylok(toAssetsUrl),
  ]);
  const fromAssets: Asset[] = fromSpaceAssetResponse.assets || [];
  const toAssets: Asset[] = toSpaceAssetResponse.assets || [];
  const toAssetsMap = new Map<string, Asset>(
    toAssets.map((asset) => {
      const assetNameArray = asset.filename?.split('/');
      return [assetNameArray[assetNameArray.length - 1], asset];
    })
  );

  for (const asset of fromAssets) {
    const toSpaceFileNameArray = asset.filename?.split('/');
    const toSpaceFileName =
      toSpaceFileNameArray[toSpaceFileNameArray.length - 1];

    if (toAssetsMap.has(toSpaceFileName)) {
      //Check folder id and if correct skip or update folder name
      console.log('Skipping Asset');
    } else {
      //Upload to new space
      console.log('Uploading Asset' + toSpaceFileName);
      await uploadFileToStoryblok(asset.filename, toSpace, asset);
    }
  }
}
