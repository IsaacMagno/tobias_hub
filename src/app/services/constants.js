export const imagesBaseUrl = "/images";

/** Avatar quando o campeão não tem linha em `files` */
export const defaultChampionAvatar = "/achievementIcons/achievementIcon.svg";

export function getChampionImageSrc(image) {
  if (image) {
    return `${imagesBaseUrl}/${image}`;
  }

  return defaultChampionAvatar;
}

export function getChampionAvatarSrc(champion) {
  const files = champion?.files;
  const row = Array.isArray(files) ? files[0] : files;

  return getChampionImageSrc(row?.image);
}
