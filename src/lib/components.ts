import { addToStorylok, getFromStorylok } from './helper';

interface ComponentGroup {
  name: string;
  id?: number;
  uuid?: string;
  parent_id?: number;
  parent_uuid?: string;
}
interface ComponentsItem {
  name: string;
  id?: number;
  component_group_uuid?: string;
}
export async function migrateComponents(fromSpace: number, toSpace: number) {
  const fromGroupsUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/component_groups/`;
  const toGroupsUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/component_groups/`;
  const fromComponentsUrl = `https://mapi.storyblok.com/v1/spaces/${fromSpace}/components/`;
  const toComponentsUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/components/`;

  const [
    fromGroupsResponse,
    toGroupsResponse,
    fromComponentResponse,
    toComponentResponse,
  ] = await Promise.all([
    getFromStorylok(fromGroupsUrl),
    getFromStorylok(toGroupsUrl),
    getFromStorylok(fromComponentsUrl),
    getFromStorylok(toComponentsUrl),
  ]);
  const fromGroups: ComponentGroup[] =
    fromGroupsResponse.component_groups || [];
  const toGroups: ComponentGroup[] = toGroupsResponse.component_groups || [];
  // Create a map of target space groups by UUID for quick lookup
  const toGroupsMap = new Map<string, ComponentGroup>(
    toGroups.map((group) => [group.name, group])
  );
  const toGroupsMapCopy = new Map<string, ComponentGroup>(
    toGroups.map((group) => [group.name, group])
  );

  // Function to get parent id from target space by name
  const getParentIdByName = async (
    parentName: string
  ): Promise<number | null> => {
    const parentGroup = toGroupsMap.get(parentName);
    if (parentGroup) return parentGroup.id;

    // If parent group doesn't exist in target space, create it
    const parentGroupData = fromGroups.find(
      (group) => group.name === parentName
    );
    if (parentGroupData) {
      const newParentGroup = await addToStorylok(toGroupsUrl, {
        component_group: {
          name: parentGroupData.name,
        },
      });
      toGroupsMap.set(parentGroupData.name, newParentGroup.component_group);
      return newParentGroup.component_group.id;
    }
    return null;
  };

  // Process each component group
  for (const group of fromGroups) {
    // Check if the group already exists in the target space by name
    if (toGroupsMap.has(group.name)) {
      console.log(`Component group "${group.name}" already exists. Skipping.`);
      continue;
    }
    // Get parent_id for the target space if the group has a parent
    let parentId = null;
    if (group.parent_uuid) {
      const parentGroup = fromGroups.find((g) => g.uuid === group.parent_uuid);
      console.log(parentGroup);
      if (parentGroup) {
        parentId = await getParentIdByName(parentGroup.name);
      }
    }
    // Add the group to the target space
    const newGroup = await addToStorylok(toGroupsUrl, {
      component_group: {
        name: group.name,
        parent_id: parentId,
      },
    });
    toGroupsMap.set(group.name, newGroup.component_group);
    console.log(`Added component group "${group.name}" to target space.`);
  }

  for (const group of fromGroups) {
    if (toGroupsMap.has(group.name)) {
      toGroupsMapCopy.delete(group.name);
    }
  }
  // Remove orphaned components folders
  for (const [, orphanedGroups] of toGroupsMapCopy) {
    await addToStorylok(
      `https://mapi.storyblok.com/v1/spaces/${toSpace}/component_groups/${orphanedGroups.id}`,
      {},
      'DELETE'
    );
    console.log(
      `Removed orphaned datasource "${orphanedGroups.name}" from target space.`
    );
  }
  console.log('Component group migration completed.');
  const toComponets = new Map<string, ComponentsItem>(
    toComponentResponse?.components?.map((component: ComponentsItem) => [
      component.name,
      component,
    ])
  );
  for (const component of fromComponentResponse?.components) {
    const inToSpaceComponent = toComponets.get(component.name);
    if (inToSpaceComponent) {
      const toUpdateComponetUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/components/${inToSpaceComponent.id}`;
      const getfromGroupName = fromGroups.find(
        (v) => v.uuid === component?.component_group_uuid
      );
      await addToStorylok(
        toUpdateComponetUrl,
        {
          component: {
            ...component,
            component_group_uuid:
              toGroupsMap.get(getfromGroupName?.name)?.uuid ?? null,
          },
        },
        'PUT'
      );
      console.log('Updating existing component.' + component?.name);

      //Updating existing component
    } else {
      const toUpdateComponetUrl = `https://mapi.storyblok.com/v1/spaces/${toSpace}/components/`;
      const getfromGroupName = fromGroups.find(
        (v) => v.uuid === component?.component_group_uuid
      );
      await addToStorylok(toUpdateComponetUrl, {
        component: {
          ...component,
          component_group_uuid:
            toGroupsMap.get(getfromGroupName?.name)?.uuid ?? null,
        },
      });
      console.log('Creating new component.' + component?.name);
    }
  }
}
