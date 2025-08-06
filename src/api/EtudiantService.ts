import { apiConfig } from "./config";
const { baseUrl } = apiConfig;
import AppService from "./AppService";

class EtudiantService extends AppService {
    constructor(token?: string) {
        super(token);
        this.endpoints = {
            ...this.endpoints,
            etudiant: '/etudiant',
            travail: '/etudiant/travail',
            commande: '/etudiant/commande',
            commandes: '/etudiant/commandes',
            payment: '/payment/create',
            check: '/payment/check',
        }
    }

    async apiEtudiant({
        id = '', 
        method = 'GET', 
        endpoint, 
        body = null
    }: {
        id?: string;
        method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
        endpoint: 'etudiant' | 'commande' | 'travail' | 'commandes' | 'payment' | 'check';
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

    async updateEtudiant({
        col,
        value,
    } : {
        col: 'nom' | 'prenom' | 'post_nom' | 'sexe' | 'password';
        value: string;
    }) {
        // Implementation for updating the "etudiant" information
        return await this.apiEtudiant({
            method: 'PUT',
            endpoint: 'etudiant',
            body: {
                col,
                value
            }
        });
    }

    async createPayment({
        reference,
        amount,
        currency = 'CDF',
        customer,
        description
    } : {
        reference: string;
        amount: number;
        currency?: string;
        customer: string;
        description?: string;
    }) {
        return await this.apiEtudiant({
            method: 'POST',
            endpoint: 'payment',
            body: {
                reference,
                amount,
                currency,
                customer,
                description
            }
        });

    }

    async checkPayment({
        orderNumber
    } : {
        orderNumber: string;
    }) {
        return await this.apiEtudiant({
            method: 'GET',
            endpoint: 'check',
            id: orderNumber
        });
    }

    async createCommande({
        travailId
    } : {
        travailId: string;
    }) {
        try {
            const request = await fetch(
                `${baseUrl}${this.endpoints.commande}`,
                {
                    method: 'POST',
                    headers: this.headers,
                    body: JSON.stringify({
                        travailId
                    })
                }
            );

            if (!request.ok) {
                throw new Error(`Error creating commande: ${request.statusText}`);
            }
            
            const responseBlob = await request.blob();
            // Create a link element to download the file
            const url = window.URL.createObjectURL(responseBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `commande_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return { success: true, message: 'Commande créée et téléchargée avec succès.' };

        } catch (error) {
            console.error('Error creating commande:', error);
            throw error;
        }
    }

    async fetchCommandes(){
        return await this.apiEtudiant({
            method: 'GET',
            endpoint: 'commandes'
        });
    }

    async getTravailById(id: string) {
        try {
            const response = await fetch(`${baseUrl}${this.endpoints.commande}/${id}/pdf`, {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`Error fetching travail by ID: ${response.statusText}`);
            }

            const responseBlob = await response.blob();

            // Create a link element to download the file
            const url = window.URL.createObjectURL(responseBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `travail_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            return { success: true, message: 'Travail téléchargé avec succès.' };

        } catch (error) {
            console.error('Error fetching travail by ID:', error);
            throw error;
            
        }
    }
}

export default EtudiantService;