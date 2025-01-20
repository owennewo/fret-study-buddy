import { gapi } from 'gapi-script';
import type { DataStore, ScoreSummary } from '@/interfaces/DataStore'
import { Score } from '@/models/Score'
import JSZip from 'jszip';

const CLIENT_ID = '636098428920-uvjfhutnn0f8h78ntv8kd8qob6i4ot74.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';

let cachedToken = null;
let tokenExpiry: number = -1;

export function useGDriveDataStore(): DataStore {
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
    return cachedToken;
  }

  function signOut() {
      const auth = gapi.auth2.getAuthInstance();
      auth.signOut();
      cachedToken = null;
      tokenExpiry = -1;
  }

  return {

     listProjects: async function() {
      const token = await signIn();

      // gapi.load('client', function () {
        await gapi.client.load('drive', 'v3') //, async function () {
          const response = await gapi.client.drive.files.list({
              q: "'appDataFolder' in parents",
              spaces: 'appDataFolder',
              // fields: 'files(id, name)'
            });
            const projects =  response.result.files.map(item => ({
              id: item.id,
              name: item.name,
            }));
            debugger;
            return projects

        // });
    // });
      // const token = await signIn();

      // const response = await gapi.client.drive.files.list({
      //   q: "mimeType='application/vnd.google-apps.folder' and 'appDataFolder' in parents",
      //   spaces: 'appDataFolder',
      //   fields: 'files(id, name)'
      // });
      // return response.result.files;
    },


    // listProjects: async function () {
    //   const token = await signIn();
    //   const query = "mimeType='application/vnd.google-apps.folder' and 'appDataFolder' in parents";

    //   const response = await fetch(
    //     `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&spaces=appDataFolder`,
    //     {
    //       headers: { Authorization: `Bearer ${token}` },
    //     }
    //   );

    //   if (!response.ok) {
    //     throw new Error(`Failed to list projects: ${response.statusText}`);
    //   }

    //   const json = await response.json();
    //   console.log('folders', json);
    //   return json.files; // Returns only folders representing projects
    // },
    createProject: async projectName => {
      const token = await signIn();

      const response = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['appDataFolder'],
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create project folder: ${response.statusText}`);
      }
      return response.json();

    },
    deleteProject: async function (projectId) {
      const token = await signIn();
      const files = await this.listScores(projectId);

      if (files && files.length > 0) {
        await Promise.all(
          files.map((file) =>
            fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
      }

      const folderResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${projectId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!folderResponse.ok) {
        throw new Error(`Failed to delete folder: ${folderResponse.statusText}`);
      }
    },
    listScores: async function (projectId) {
      const token = await signIn();
      const query = `'${projectId}' in parents`;
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list scores: ${response.statusText}`);
      }

      const json = await response.json();
      return json.files.map(file=> ({
        id: file.id,
        title: file.name.split('.')[0],
      })); // Returns all scores in the project folder
    },
    getScore: async function (projectId, scoreId) {
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
    deleteScore: async function (projectId, scoreId) {
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
    saveScore: async function (projectId, score) {
      const token = await signIn();

      const metadata = {
        name: `${score.title}.json`,
        ...(!score.id && { parents: [projectId] }),  // only add parent if score is new
      };

      const fileContent = JSON.stringify(score);
      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      formData.append('file', new Blob([fileContent], { type: 'application/json' }));

      let response;

      if (score.id) {
        // If the score has an ID, update the existing file
        response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${score.id}?uploadType=multipart`,
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
        title: score.title,
      } as ScoreSummary;
    },
    exportProject: async function (projectId) {
      const token = await signIn();
      const files = await this.listScores(projectId);

      if (!files || files.length === 0) {
        throw new Error("No scores found for this project");
      }

      const zip = new JSZip();

      // Fetch each score and add it to the zip
      await Promise.all(
        files.map(async (file) => {
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch score ${file.title}: ${response.statusText}`);
          }

          const blob = await response.blob();
          zip.file(`${file.title}.json`, blob);
        })
      );

      // Generate the zip file as a Blob
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      return zipBlob; // The calling code can handle downloading this blob
    },
    importProject: async function (projectName, projectBlob) {
      const token = await signIn();

      // Step 1: Create the project folder
      const project = await this.createProject(projectName);

      // Step 2: Extract the zip file contents
      const zip = await JSZip.loadAsync(projectBlob);
      const files = Object.keys(zip.files);

      if (files.length === 0) {
        throw new Error('The provided project zip is empty.');
      }

      // Step 3: Save each extracted file as a score
      await Promise.all(
        files.map(async (fileName) => {
          const file = zip.files[fileName];
          if (!file.dir) {
            const fileContent = await file.async('string'); // Get the file content as a string
            const scoreData = JSON.parse(fileContent); // Parse the JSON content
            const score = new Score(scoreData); // Assume Score model handles JSON parsing
            await this.saveScore(project.id, score); // Save the score to the project
          }
        })
      );

      return project; // Return the created project metadata
    },

    syncScore: async (projectId: string, score: Score) => {
      // do nothing
    }
  }
}
