import type { Metadata } from "@/models/Metadata";
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
    // createProject(projectName: string): Promise<Project>; // Example: Creates a new project with a given name
    // deleteProject(projectId: string): Promise<void>; // Example: Deletes a project by name
    listScores(): Promise<Metadata[]>; // Example: Returns a list of scores by project ID
    getScore(scoreId: string): Promise<Score | null>; // Example: Fetches a score by project ID and score ID
    saveScore(score: Score): Promise<Metadata>; // Example: Saves a score
    deleteScore(scoreId: string): Promise<void>; // Example: Deletes a score by project ID and score ID
    // exportProject(): Promise<Blob>; // Example: Exports a project as a Blob
    // importProject(projectName: string, projectBlob: Blob): Promise<Project>; // Example: Imports a project from a Blob
    syncScore(score: Score): Promise<void>; // Example: Syncs a score
  }
