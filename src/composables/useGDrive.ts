import { gapi } from 'gapi-script';
import { useIndexedDBStore } from '@/stores/useIndexedDBStore';
const CLIENT_ID = '636098428920-uvjfhutnn0f8h78ntv8kd8qob6i4ot74.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let cachedToken = null;
let tokenExpiry: number = -1;

export const useGDrive = () => {

    const { exportProject } = useIndexedDBStore();

    function initializeGapi() {
      return new Promise((resolve, reject) => {
        gapi.load('client:auth2', () => {
          gapi.client
            .init({ clientId: CLIENT_ID, scope: SCOPES })
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      });
    }
    
    async function signIn() {
      const now = Date.now();
      if (cachedToken && tokenExpiry && now < tokenExpiry) {
        return cachedToken;
      }
    
      await initializeGapi();
      const auth = gapi.auth2.getAuthInstance();
      await auth.signIn();
      const token = gapi.auth.getToken().access_token;
      cachedToken = token;
      tokenExpiry = now + 3600 * 1000; // Token valid for 1 hour
      return token;
    }

    function signOut() {
        const auth = gapi.auth2.getAuthInstance();
        auth.signOut();
        cachedToken = null;
        tokenExpiry = -1;
      }
      
    
    async function listFiles() {
        const token = await signIn();
        // debugger
        const response = await fetch(
          'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder',
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const json = await response.json()
        return json.files;
      }

      async function uploadFile(projectName) {
        const token = await signIn();
    
        // Export the IndexedDB project
        const projectBlob = await exportProject(projectName);
        if (!projectBlob) {
          console.warn('No project data to upload');
          return null;
        }
    
        const metadata = {
          name: `${projectName}.zip`, // File name in AppData
          parents: ['appDataFolder'], // Upload to AppData folder
        };
    
        const formData = new FormData();
        formData.append(
          'metadata',
          new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        formData.append('file', projectBlob);
    
        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
    
        return response.json();
      }

      async function downloadFile(fileId): Promise<File> {
        const token = await signIn();
    
        // Fetch the file blob from Google Drive
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
    
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
    
        const fileBlob = await response.blob();
        
        // Pass the file blob to `importProject` for restoration
        return new File([fileBlob], 'project.zip'); // Wrap Blob in a File for compatibility
      }
    
    return {  signIn, signOut, listFiles, uploadFile, downloadFile };
}
