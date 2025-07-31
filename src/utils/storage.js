import localforage from "localforage";

export const saveLocaleData = async (key, data) => {
  try {
    await localforage.setItem(key, data);
    return true;
  } catch (e) {
    // Silent - storage operations should not spam logs
    return false;
  }
};

export const retrieveLocalData = async (key) => {
  try {
    const data = localforage(key);
    return data;
  } catch (e) {
    // Silent - storage operations should not spam logs
    return "";
  }
};

// Sanitize data by removing/replacing null values for IndexedDB compatibility
export const sanitizeDataForStorage = (data) => {
  if (data === null || data === undefined) {
    return "";
  }
  
  if (typeof data === 'object' && data instanceof Date) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForStorage(item));
  }
  
  if (typeof data === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeDataForStorage(value);
    }
    return sanitized;
  }
  
  return data;
};

export const setItemStorage = async (key, data) => {
  try {
    await localforage.setItem(key, sanitizeDataForStorage(data));
    return true;
  } catch (error) {
    // Silent - storage operations should not spam logs
    return false;
  }
};