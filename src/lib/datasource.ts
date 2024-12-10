import { addToStorylok, getFromStorylok } from './helper';

interface DatasourceType {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}
interface DatasourceEntryType {
  id: number;
  name: string;
  value: string;
}

export async function migrateDatasources(fromSpace: number, toSpace: number) {
  const fromDatasourcesUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/datasources/`;
  const toDatasourcesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasources/`;

  const [fromDatasources, toDatasources] = await Promise.all([
    getFromStorylok(fromDatasourcesUrl),
    getFromStorylok(toDatasourcesUrl),
  ]);
  if (!fromDatasources?.datasources) {
    console.error('No datasources found.');
    return;
  }
  // Create a map of datasources by slug for space2 for quick lookup
  const toDatasourcesMap: Map<string, DatasourceType> = new Map(
    toDatasources.datasources?.map((ds: DatasourceType) => [ds.slug, ds])
  );
  await Promise.all(
    fromDatasources.datasources.map(async (datasource: DatasourceType) => {
      const fromEntriesUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/datasource_entries/?datasource_id=${datasource.id}`;
      const datasourceEntries = await getFromStorylok(fromEntriesUrl);
      const toDatasource = toDatasourcesMap.get(datasource.slug);
      if (!toDatasource) {
        // Datasource doesn't exist in space2, create it
        const newDatasource = await addToStorylok(toDatasourcesUrl, datasource);
        //Add all the datasource_entries
        await Promise.all(
          datasourceEntries.datasource_entries.map(
            async (entry: DatasourceEntryType) => {
              const entriesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasource_entries`;
              await addToStorylok(entriesUrl, {
                datasource_entry: {
                  ...entry,
                  datasource_id: newDatasource.datasource.id,
                },
              });
            }
          )
        );
        console.log(`Create datasource "${datasource.slug}" in target space.`);
      } else {
        const toEntriesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasource_entries/?datasource_id=${toDatasource.id}`;
        const toDatasourceEntries = await getFromStorylok(toEntriesUrl);
        const toEntriesMap: Map<string, DatasourceEntryType> = new Map(
          toDatasourceEntries.datasource_entries?.map(
            (ds: DatasourceEntryType) => [ds.name, ds]
          )
        );
        //Sync datasource_entries
        await Promise.all(
          datasourceEntries.datasource_entries.map(
            async (entry: DatasourceEntryType) => {
              const toEntry = toEntriesMap.get(entry.name);
              if (!toEntry) {
                console.log('creating new datasource_entrie');
                const entriesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasource_entries`;
                await addToStorylok(entriesUrl, {
                  datasource_entry: {
                    ...entry,
                    datasource_id: toDatasource.id,
                  },
                });
              } else if (toEntry.value !== entry.value) {
                console.log('update the datasource_entrie value running');
                const entriesUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasource_entries/${toEntry.id}`;
                await addToStorylok(
                  entriesUrl,
                  {
                    datasource_entry: {
                      id: toEntry.id,
                      name: entry.name,
                      value: entry.value,
                    },
                  },
                  'PUT'
                );
              }
              toEntriesMap.delete(entry.name);
            }
          )
        );
        // Remove orphaned entries
        for (const [, orphanedEntry] of toEntriesMap) {
          await addToStorylok(
            `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasource_entries/${orphanedEntry.id}`,
            {},
            'DELETE'
          );
          console.log(
            `Removed orphaned entry "${orphanedEntry.name}" from target space.`
          );
        }
      }
      toDatasourcesMap.delete(datasource.slug);
    })
  );
  // Remove orphaned datasources
  for (const [, orphanedDatasource] of toDatasourcesMap) {
    await addToStorylok(
      `https://mapi.storyblok.com/v1/spaces/${toSpace}/datasources/${orphanedDatasource.id}`,
      {},
      'DELETE'
    );
    console.log(
      `Removed orphaned datasource "${orphanedDatasource.slug}" from target space.`
    );
  }
  console.log('Datasource comparison and synchronization completed.');
}
