import { apiConfig } from "./config";
const { baseUrl, headers } = apiConfig;
import AppService from "./AppService";

class TitulaireService extends AppService {
    constructor(token?: string) {
        super(token);
        this.endpoints = {
            ...this.endpoints,
            titulaire: '/titulaire',
            retrait: '/titulaire/retrait',
            travail: '/titulaire/travail',
            commande: '/titulaire/commande',
        }
    }

    async apiTitulaire({
        id = '', 
        method = 'GET', 
        endpoint, 
        body = null
    }: {
        id?: string;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        endpoint: 'titulaire' | 'retrait' | 'travail' | 'commande';
        body?: any;
    }) {
        const url = `${this.endpoints[endpoint]}${id ? `/${id}` : ''}`;
        try {
            const response = await fetch(`${baseUrl}${url}`, {
                method,
                headers: this.headers,
                body: body ? JSON.stringify(body) : undefined,
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

    async updateTitulaire({
        col,
        value,
    } : {
        col: 'nom' | 'prenom' | 'post_nom' | 'sexe' | 'password';
        value: string;
    }) {
        // Implementation for updating the "titulaire" information
        return await this.apiTitulaire({
            method: 'PUT',
            endpoint: 'titulaire',
            body: {
                col,
                value
            }
        });
    }

    async createTravail({
        theme,
        description,
        consignes,
        montant,
        max,
        questionnaire
    } : {
        theme: string;
        description: string[];
        consignes: string[];
        montant: number;
        max: number;
        questionnaire?: {
            enonce: string;
            image?: string;
            response: number;
            pts: number;
        }[];
    }) {
        return await this.apiTitulaire({
            method: 'POST',
            endpoint: 'travail',
            body: {
                theme,
                description,
                consignes,
                montant,
                max,
                questionnaire
            }
        });
    }

    async updateTravail({
        id,
        col,
        value,
    } : {
        id: string;
        col: 'theme' | 'description' | 'consignes' | 'montant' | 'max';
        value: string | number | string[];
    }) {
        return await this.apiTitulaire({
            method: 'PUT',
            endpoint: 'travail',
            body: {
                col,
                value,
                id
            }
        });
    }

    async fetchTravaux(){
        return await this.apiTitulaire({
            method: 'GET',
            endpoint: 'travail'
        });
    }

    async fetchTravail(id: string) {
        return await this.apiTitulaire({
            method: 'GET',
            endpoint: 'travail',
            id
        });
    }

    async updateCommande({
        id,
        col,
        value,
    } : {
        id: string;
        col: 'theme' | 'description' | 'consignes' | 'montant' | 'max' | 'observations' | 'commentaire';
        value: string | number | string[];
    }) {
        return await this.apiTitulaire({
            method: 'PUT',
            endpoint: 'commande',
            body: {
                col,
                value,
                id
            }
        });
    }

    async deleteTravail(id: string) {
        return await this.apiTitulaire({
            method: 'DELETE',
            endpoint: 'travail',
            body: {
                id
            }
        });
    }

    async createRetrait({
        reference,
        amount
    }: {
        reference: string;
        amount: number;
    }) {
        return await this.apiTitulaire({
            method: 'POST',
            endpoint: 'retrait',
            body: {
                reference,
                amount
            }
        });
    }

    async deleteRetrait(id: string) {
        return await this.apiTitulaire({
            method: 'DELETE',
            endpoint: 'retrait',
            id
        });
    }
}

export default TitulaireService;