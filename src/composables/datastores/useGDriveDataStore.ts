import { gapi } from 'gapi-script';
import { Score } from '@/models/Score'
import type { Metadata } from '@/models/Metadata';
import { useCursor } from '../useCursor';

const CLIENT_ID = '636098428920-uvjfhutnn0f8h78ntv8kd8qob6i4ot74.apps.googleusercontent.com';
// const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.install https://www.googleapis.com/auth/drive.file'
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata'

export function useGDriveDataStore() {

  const { googleToken, googleTokenExpiry } = useCursor()


  async function signIn() {
    const now = Date.now();


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
    await gapi.client.load('drive', 'v3')

    if (googleToken.value && googleTokenExpiry.value && now < googleTokenExpiry.value) {
      console.log(`reusing cached token (exp=${new Date(googleTokenExpiry.value)}`)
      return googleToken.value;
    }


    await gapi.auth2.getAuthInstance().signIn();
    googleTokenExpiry.value = now + 3600 * 1000
    googleToken.value = gapi.auth.getToken().access_token;
    console.log("token stored ")
    return googleToken.value;
  }

  function signOut() {
    const auth = gapi.auth2.getAuthInstance();
    auth.signOut();
    googleTokenExpiry.value = -1
    googleToken.value = null;
  }

  return {

    listScores: async function () {
      const token = await signIn();

      const params = new URLSearchParams({
        spaces: 'appDataFolder',
        fields: 'files(id,name,appProperties)'
      });

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      const results = data.files.map(item => {
        const props = item.appProperties
        props.remoteId = item.id
        return props
      })

      return results;
    },

    getScore: async function (metadata: Metadata) {
      const token = await signIn();

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${metadata.remoteId}?alt=media`,
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
      score.id = metadata.id
      return Score.fromJSON(score); // Assumes `Score` can parse a JSON string
    },
    deleteScore: async function (scoreId) {
      const token = await signIn();

      const match = await this.findScore(scoreId) as Metadata

      if (match) {
        console.log('deleting', match.id, match.remoteId)
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${match.remoteId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete score: ${response.statusText}`);
        }
      } else {
        console.warn(`Score not found: ${scoreId}`);
      }
    },
    findScore: async function (scoreId: string): Promise<Metadata | boolean> {
      if (!scoreId) return false;
      const scores = await this.listScores();
      const metadata = scores.find(metadata => metadata.id == scoreId)
      return metadata;
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
          version: parseInt(score.metadata!.version),
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

      // let response;
      const match = await this.findScore(score.metadata.id)

      if (match) {
        // console.log('patch', match.id, match.googleId)
        // debugger
        // // If the score has an ID, update the existing file
        // // response = await fetch(
        // //   `https://www.googleapis.com/upload/drive/v3/files/${match.googleId}?uploadType=multipart`,
        // //   {
        // //     method: 'PUT',
        // //     headers: { Authorization: `Bearer ${token}` },
        // //     body: formData,
        // //   }
        // // );

        // response = await gapi.client.request({
        //   path: `/upload/drive/v3/files/${match.googleId}`,
        //   method: 'PUT',
        //   params: { uploadType: 'multipart' },
        //   // headers: {
        //   //   'Content-Type': `multipart/related"`
        //   // },
        //   body: formData,
        // });

        this.deleteScore(score.metadata.id)
      }

      // } else {
      // If the score does not have an ID, create a new file
      // metadata.parents = [projectId];
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        }
      );
      // }

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
