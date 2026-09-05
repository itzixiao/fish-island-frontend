const BLACKLIST_STORAGE_KEY = 'fish-chat-blacklist';
const BLACKLIST_PROFILE_STORAGE_KEY = 'fish-chat-blacklist-profiles';
const BLACKLIST_CHANGE_EVENT = 'fishChatBlacklistChange';

const normalizeUserId = (userId: string | number) => String(userId);

export interface BlacklistedUserProfile {
  id: string;
  name: string;
  avatar?: string;
}

export const loadBlacklistedUserIds = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();

  try {
    const value = JSON.parse(localStorage.getItem(BLACKLIST_STORAGE_KEY) || '[]');
    if (!Array.isArray(value)) return new Set();
    return new Set(value.map((id) => String(id)).filter(Boolean));
  } catch {
    return new Set();
  }
};

const saveBlacklistedUserIds = (userIds: Set<string>) => {
  localStorage.setItem(BLACKLIST_STORAGE_KEY, JSON.stringify(Array.from(userIds)));
  window.dispatchEvent(
    new CustomEvent(BLACKLIST_CHANGE_EVENT, {
      detail: Array.from(userIds),
    }),
  );
};

export const loadBlacklistedUserProfiles = (): Record<string, BlacklistedUserProfile> => {
  if (typeof window === 'undefined') return {};

  try {
    const value = JSON.parse(localStorage.getItem(BLACKLIST_PROFILE_STORAGE_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value;
  } catch {
    return {};
  }
};

const saveBlacklistedUserProfiles = (profiles: Record<string, BlacklistedUserProfile>) => {
  localStorage.setItem(BLACKLIST_PROFILE_STORAGE_KEY, JSON.stringify(profiles));
};

export const isUserBlacklisted = (userId: string | number) =>
  loadBlacklistedUserIds().has(normalizeUserId(userId));

export const addBlacklistedUser = (
  userId: string | number,
  profile?: Omit<BlacklistedUserProfile, 'id'>,
) => {
  const userIds = loadBlacklistedUserIds();
  const id = normalizeUserId(userId);
  userIds.add(id);
  if (profile) {
    const profiles = loadBlacklistedUserProfiles();
    profiles[id] = { id, ...profile };
    saveBlacklistedUserProfiles(profiles);
  }
  saveBlacklistedUserIds(userIds);
  return userIds;
};

export const removeBlacklistedUser = (userId: string | number) => {
  const userIds = loadBlacklistedUserIds();
  const id = normalizeUserId(userId);
  userIds.delete(id);
  const profiles = loadBlacklistedUserProfiles();
  delete profiles[id];
  saveBlacklistedUserProfiles(profiles);
  saveBlacklistedUserIds(userIds);
  return userIds;
};

export const BLACKLIST_EVENT = BLACKLIST_CHANGE_EVENT;
