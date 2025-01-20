import type { Score } from "@/models/Score";

export interface Project {
    id: string;
    name: string;
    type: string;
    scores: ScoreSummary[];
}

export interface ScoreSummary  {
    id: string;
    title: string;
    path: string;
    createdDateTime: Date;
    modifiedDateTime: Date;
}

export interface DataStore {
    listProjects(): Promise<Project[]>; // Example: Returns a list of project names
    createProject(projectName: string): Promise<Project>; // Example: Creates a new project with a given name
    deleteProject(projectId: string): Promise<void>; // Example: Deletes a project by name
    listScores(projectId: string): Promise<ScoreSummary[]>; // Example: Returns a list of scores by project ID
    getScore(projectId: string, scoreId: string): Promise<Score | null>; // Example: Fetches a score by project ID and score ID
    saveScore(projectId: string, score: Score): Promise<ScoreSummary>; // Example: Saves a score
    deleteScore(projectId: string, scoreId: string): Promise<void>; // Example: Deletes a score by project ID and score ID
    exportProject(projectId: string): Promise<Blob>; // Example: Exports a project as a Blob
    importProject(projectName: string, projectBlob: Blob): Promise<Project>; // Example: Imports a project from a Blob
    syncScore(projectId, score: Score): Promise<void>; // Example: Syncs a score
  }
