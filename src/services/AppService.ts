import { apiConfig } from '../api/config';

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    etudiant?: any;
    titulaire?: any;
    token: string;
  };
}

export interface RegisterResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export class AppService {
  private baseURL: string;

  constructor() {
    this.baseURL = apiConfig.baseUrl;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      ...apiConfig.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async loginEtudiant(credentials: { matricule: string; password: string }): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest('/auth/etudiant/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      return {
        success: true,
        message: 'Connexion réussie',
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la connexion'
      };
    }
  }

  async loginTitulaire(credentials: { matricule: string; password: string }): Promise<LoginResponse> {
    try {
      const response = await this.makeRequest('/auth/titulaire/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      return {
        success: true,
        message: 'Connexion réussie',
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la connexion'
      };
    }
  }

  async registerEtudiant(userData: {
    matricule: string;
    password: string;
    nom: string;
    post_nom: string;
    prenom: string;
    sexe: string;
  }): Promise<RegisterResponse> {
    try {
      const response = await this.makeRequest('/auth/etudiant/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      return {
        success: true,
        message: 'Inscription réussie',
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'inscription'
      };
    }
  }

  async registerTitulaire(userData: {
    matricule: string;
    password: string;
    nom: string;
    post_nom: string;
    prenom: string;
    sexe: string;
  }): Promise<RegisterResponse> {
    try {
      const response = await this.makeRequest('/auth/titulaire/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      
      return {
        success: true,
        message: 'Inscription réussie',
        data: response
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'inscription'
      };
    }
  }
}
