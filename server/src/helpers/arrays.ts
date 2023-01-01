export const updateInPlace = <T extends { id: string }>(
  entity: T,
  collection: T[]
) => {
  const index = collection.findIndex((each) => each.id === entity.id);

  if (index === -1) {
    return collection;
  }

  const earlier = collection.slice(0, index);
  const later = collection.slice(index + 1);

  return [...earlier, entity, ...later];
};
