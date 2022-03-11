/**
 *
 * @param path
 * @returns
 */
export const fileFromPath = async (path: string) => {
  const res = await fetch(path, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }

  const blob = await res.blob();

  const name = path.slice(path.lastIndexOf("/") + 1);

  const file = new File([blob], name);

  return file;
};
