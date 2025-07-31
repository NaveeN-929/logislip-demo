// Google Drive utility functions

// Search for a folder by name
export async function searchGoogleDriveFolder({ accessToken, folderName }) {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
  });
  
  if (!res.ok) throw new Error('Failed to search folders: ' + (await res.text()));
  const data = await res.json();
  return data.files.length > 0 ? data.files[0] : null;
}

// Search for a folder by name within a parent folder
export async function searchGoogleDriveFolderInParent({ accessToken, folderName, parentId }) {
  const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
  
  const res = await fetch(url, {
    method: 'GET',
    headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
  });
  
  if (!res.ok) throw new Error('Failed to search folders: ' + (await res.text()));
  const data = await res.json();
  return data.files.length > 0 ? data.files[0] : null;
}

// Create a new folder
export async function createGoogleDriveFolder({ accessToken, folderName, parentId }) {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentId ? { parents: [parentId] } : {}),
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) throw new Error('Failed to create folder: ' + (await res.text()));
  return res.json();
}

// Find or create a folder
export async function findOrCreateGoogleDriveFolder({ accessToken, folderName, parentId }) {
  // First, try to find existing folder
  let folder;
  
  if (parentId) {
    folder = await searchGoogleDriveFolderInParent({ accessToken, folderName, parentId });
  } else {
    folder = await searchGoogleDriveFolder({ accessToken, folderName });
  }
  
  // If not found, create new folder
  if (!folder) {
    folder = await createGoogleDriveFolder({ accessToken, folderName, parentId });
  }
  
  return folder;
}

// Create nested folder structure based on path array
export async function createNestedFolderStructure({ accessToken, folderPath }) {
  let currentParentId = null;
  
  for (const folderName of folderPath) {
    const folder = await findOrCreateGoogleDriveFolder({ 
      accessToken, 
      folderName, 
      parentId: currentParentId 
    });
    currentParentId = folder.id;
  }
  
  return currentParentId; // Return the final folder ID
}

// Generate folder path based on creation date
export function generateInvoiceFolderPath(creationDate) {
  const date = new Date(creationDate);
  const year = date.getFullYear().toString();
  const month = date.toLocaleDateString('en-US', { month: 'long' }); // January, February, etc.
  
  return ['invoices', year, month];
}

// Upload file to Google Drive
// Requires: accessToken (from Google OAuth), file (Blob), fileName, folderId (optional)
export async function uploadToGoogleDrive({ accessToken, file, fileName, folderId }) {
  const metadata = {
    name: fileName,
    mimeType: file.type || 'application/pdf',
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
    method: 'POST',
    headers: new Headers({ Authorization: `Bearer ${accessToken}` }),
    body: form,
  });
  if (!res.ok) throw new Error('Google Drive upload failed: ' + (await res.text()));
  return res.json();
}

// Upload to Google Drive with folder name (finds or creates folder)
export async function uploadToGoogleDriveWithFolder({ accessToken, file, fileName, folderName }) {
  let folderId = undefined;
  
  if (folderName && folderName.trim()) {
    const folder = await findOrCreateGoogleDriveFolder({ accessToken, folderName: folderName.trim() });
    folderId = folder.id;
  }
  
  return uploadToGoogleDrive({ accessToken, file, fileName, folderId });
}

// Upload to Google Drive with nested folder structure
export async function uploadToGoogleDriveWithNestedFolder({ accessToken, file, fileName, folderPath }) {
  let folderId = undefined;
  
  if (folderPath && folderPath.length > 0) {
    folderId = await createNestedFolderStructure({ accessToken, folderPath });
  }
  
  return uploadToGoogleDrive({ accessToken, file, fileName, folderId });
}
