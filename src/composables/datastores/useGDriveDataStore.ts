import { gapi } from 'gapi-script';
import { Score } from '@/models/Score'
import type { Metadata } from '@/models/Metadata';

const CLIENT_ID = '636098428920-uvjfhutnn0f8h78ntv8kd8qob6i4ot74.apps.googleusercontent.com';
// const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/drive.file'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'



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

    listScores: async function () {
      const token = await signIn();
      const response = await gapi.client.drive.files.list({
        q: "'appDataFolder' in parents",
        spaces: 'appDataFolder',
        fields: 'files(id, name, appProperties, parents)',
      });
      const projects = response.result.files.map(item => {
        const props = item.appProperties
        props.googleId = item.id
        return props
      }

      )
      // ({
      //   id: item.appProperties.scoreId,
      //   title: item.appProperties.title,
      //   project: item.appProperties.project,

      //   scoreId: score.metadata!.id,
      //   title: score.metadata!.title,
      //   project: score.metadata!.project,
      //   version: score.metadata!.version,
      //   clientId: score.metadata!.clientId,
      //   hash: score.metadata!.hash,
      //   modifiedDateTime: score.metadata!.modifiedDateTime,
      //   createdDateTime: score.metadata!.createdDateTime,


      // }));
      console.log("projects", projects)
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
      // const projectId = 'XXXXXXXXXXXXXXXXXXXX'
      const metadata = {
        name: `${score.metadata!.title}.json`,
        parents: ['appDataFolder'],  // only add parent if score is new
        appProperties: {
          id: score.metadata!.id,
          title: score.metadata!.title,
          project: score.metadata!.project,
          version: score.metadata!.version,
          clientId: score.metadata!.clientId,
          hash: score.metadata!.hash,
          modifiedDateTime: score.metadata!.modifiedDateTime,
          createdDateTime: score.metadata!.createdDateTime,
        },
      };

      const fileContent = JSON.stringify(score);
      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      formData.append('file', new Blob([fileContent], { type: 'application/json' }));

      let response;

      debugger
      if (await this.hasScore(score.metadata.id)) {
        // If the score has an ID, update the existing file
        response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${score.metadata!.id}?uploadType=multipart`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
      } else {
        // If the score does not have an ID, create a new file
        // metadata.parents = [projectId];
        response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          }
        );
      }

      if (!response.ok) {
        throw new Error(`Failed to save score: ${response.statusText}`);
      }

      const json = await response.json();

      return {
        id: json.id,
        title: score.metadata!.title,
      } as Metadata;
    },
    syncScore: async (score: Score) => {
      // do nothing
    }
  }
}
