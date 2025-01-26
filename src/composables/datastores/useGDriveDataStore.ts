import { gapi } from 'gapi-script';
import type { DataStore } from '@/interfaces/DataStore'
import { Score } from '@/models/Score'
import type { Metadata } from '@/models/Metadata';

const CLIENT_ID = '636098428920-uvjfhutnn0f8h78ntv8kd8qob6i4ot74.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let cachedToken = null;
let tokenExpiry: number = -1;

export function useGDriveDataStore() {
  async function signIn() {
    const now = Date.now();

    if (cachedToken && tokenExpiry && now < tokenExpiry) {
      return cachedToken;
    }

    await new Promise((resolve, reject) => {
      gapi.load('client:auth2', () => {
        if (gapi.client) {
          resolve(true);
        } else {
          reject(new Error("Failed to load gapi.client"));
        }
      });
    });

    await gapi.client.init({ clientId: CLIENT_ID, scope: SCOPES });

    await gapi.auth2.getAuthInstance().signIn();
    cachedToken = gapi.auth.getToken().access_token;
    tokenExpiry = now + 3600 * 1000; // Token valid for 1 hour
    await gapi.client.load('drive', 'v3')
    return cachedToken;
  }

  function signOut() {
    const auth = gapi.auth2.getAuthInstance();
    auth.signOut();
    cachedToken = null;
    tokenExpiry = -1;
  }

  return {

    // listProjects: async function () {
    //   const token = await signIn();

    //   const response = await gapi.client.drive.files.list({
    //     q: "'appDataFolder' in parents",
    //     spaces: 'appDataFolder',
    //     // fields: 'files(id, name)'
    //   });
    //   const projects = response.result.files.map(item => ({
    //     id: item.id,
    //     name: item.name,
    //   }));
    //   debugger;
    //   return projects

    // },

    listScores: async function () {
      const token = await signIn();


      const response = await gapi.client.drive.files.list({
        q: "'appDataFolder' in parents",
        spaces: 'appDataFolder',
        fields: 'files(id, name)'
      });
      const projects = response.result.files.map(item => ({
        id: item.id,
        name: item.name,
      }));
      debugger;
      return projects
    },

    getScore: async function (scoreId) {
      const token = await signIn();

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${scoreId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get score: ${response.statusText}`);
      }

      const fileBlob = await response.blob();
      const scoreText = await fileBlob.text()
      const score = JSON.parse(scoreText)
      score.id = scoreId
      return Score.fromJSON(score); // Assumes `Score` can parse a JSON string
    },
    deleteScore: async function (scoreId) {
      const token = await signIn();

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${scoreId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete score: ${response.statusText}`);
      }
    },
    hasScore: async function (scoreId: string): Promise<boolean> {
      if (!scoreId) return false; // If no ID is provided, treat it as non-existent

      try {
        const response = await gapi.client.drive.files.get({
          fileId: scoreId,
          fields: 'id', // Fetch minimal fields to check existence
        });

        return !!response.result.id; // If a result ID is returned, the file exists
      } catch (error) {
        if (error.status === 404) {
          // File not found
          return false;
        } else {
          // Handle other errors
          throw new Error(`Error checking file existence: ${error}`);
        }
      }
    },
    saveScore: async function (score) {
      const token = await signIn();
      debugger

      const metadata = {
        name: `${score.metadata!.title}.json`,
        mimeType: 'application/json',
        parents: ['appDataFolder'], // Ensure the file is saved in the appDataFolder
      };

      const fileContent = JSON.stringify(score);
      const fileBlob = new Blob([fileContent], { type: 'application/json' });

      // Check if the score already exists
      const fileExists = await this.hasScore(score.metadata!.id);

      let response;

      if (fileExists) {
        // If the file exists, update it
        response = await gapi.client.drive.files.update({
          fileId: score.metadata!.id,
          uploadType: 'media', // Use media upload for simplicity
          resource: metadata,
          media: {
            mimeType: 'application/json',
            body: fileBlob,
          },
        });
      } else {
        // If the file does not exist, create it
        response = await gapi.client.drive.files.create({
          uploadType: 'media',
          resource: metadata,
          media: {
            mimeType: 'application/json',
            body: fileBlob,
          },
        });
      }

      if (!response.result) {
        throw new Error(`Failed to save score: ${response}`);
      }

      return {
        id: response.result.id,
        title: score.metadata!.title,
      } as Metadata;
    },


    syncScore: async (score: Score) => {
      // do nothing
    }
  }
}
