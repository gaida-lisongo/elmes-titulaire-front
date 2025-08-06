import { apiConfig } from "./config";
const { baseUrl, headers } = apiConfig;

type Endpoints = {
  travaux: string;
  etudiants: string;
  titulaires: string;
  authEtudiant: string;
  authTitulaire: string;
  registerEtudiant: string;
  registerTitulaire: string;
  titulaire?: string;
  retrait?: string;
  travail?: string;
  commande?: string;
  etudiant?: string;
  commandes?: string;
  payment?: string;
  check?: string;
  recharges?: string;
}

class AppService {
  endpoints: Endpoints;
  headers: Record<string, string>;
  
  // Define your service methods here
  constructor(token?: string) {
    this.endpoints = {
        travaux: '/',
        etudiants: '/etudiants',
        titulaires: '/titulaires',
        authEtudiant: '/etudiant/login',
        authTitulaire: '/titulaire/login',
        registerEtudiant: '/etudiant/create',
        registerTitulaire: '/titulaire/create',
    }

    this.headers = {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

  }

  async fetchData(endpoint: keyof Endpoints) {
    const url = this.endpoints[endpoint];
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        throw new Error(`Error fetching data from ${url}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async fetchTravaux() {
    return this.fetchData('travaux');
  }

  async fetchEtudiants() {
    return this.fetchData('etudiants');
  }

  async fetchTitulaires() {
    return this.fetchData('titulaires');
  }

  async loginEtudiant({
    matricule,
    password
  }: {
    matricule: string;
    password: string;
  }) {
    const url = this.endpoints.authEtudiant;
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ matricule, password })
      });

      if (!response.ok) {
        throw new Error(`Error logging in: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async registerEtudiant({
    nom,
    post_nom,
    prenom,
    matricule,
    sexe,
    password
  }: {
    nom: string;
    post_nom: string;
    prenom: string;
    matricule: string;
    sexe: "M" | "F";
    password: string;
  }) {
    const url = this.endpoints.registerEtudiant;
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ nom, post_nom, prenom, matricule, sexe, password })
      });

      if (!response.ok) {
        throw new Error(`Error registering: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async loginTitulaire({
    matricule,
    password
  }: {
    matricule: string;
    password: string;
  }) {
    const url = this.endpoints.authTitulaire;
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ matricule, password })
      });

      if (!response.ok) {
        throw new Error(`Error logging in: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async registerTitulaire({
    nom,
    post_nom,
    prenom,
    matricule,
    sexe,
    password
  }: {
    nom: string;
    post_nom: string;
    prenom: string;
    matricule: string;
    sexe: "M" | "F";
    password: string;
  }) {
    const url = this.endpoints.registerTitulaire;
    try {
      const response = await fetch(`${baseUrl}${url}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ nom, post_nom, prenom, matricule, sexe, password })
      });

      if (!response.ok) {
        throw new Error(`Error registering: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default AppService;